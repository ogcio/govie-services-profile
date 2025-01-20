import { parseFile } from "fast-csv";
import type { KnownProfileDataDetails } from "~/schemas/profiles/index.js";
import { normalizeCsvValue } from "~/utils/csv/normalize-csv-value.js";

type ProfileRow = KnownProfileDataDetails;

export const getProfilesFromCsv = async (
  filePath: string,
): Promise<ProfileRow[]> => {
  const records: ProfileRow[] = [];
  const parser = parseFile<ProfileRow, ProfileRow[]>(filePath, {
    headers: true,
  }).transform(
    ({
      firstName,
      lastName,
      email,
      ...otherProps
    }: ProfileRow): ProfileRow | null => {
      if (!firstName || !lastName || !email) {
        // TODO: handle error
        return null;
      }

      return normalizeCsvRow({
        firstName,
        lastName,
        email,
        ...otherProps,
      });
    },
  );

  for await (const row of parser) {
    records.push(row);
  }

  return records;
};

const normalizeCsvRow = (row: KnownProfileDataDetails): ProfileRow => ({
  firstName: normalizeCsvValue(row.firstName) as string,
  lastName: normalizeCsvValue(row.lastName) as string,
  phone: normalizeCsvValue(row.phone),
  dateOfBirth: normalizeCsvValue(row.dateOfBirth),
  email: normalizeCsvValue(row.email) as string,
  address: normalizeCsvValue(row.address),
  city: normalizeCsvValue(row.city),
  preferredLanguage: normalizeCsvValue(row.preferredLanguage) as
    | "en"
    | "ga"
    | undefined,
});

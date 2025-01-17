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
      first_name,
      last_name,
      email,
      ...otherProps
    }: ProfileRow): ProfileRow | null => {
      if (!first_name || !last_name || !email) {
        // TODO: handle error
        return null;
      }

      return normalizeCsvRow({
        first_name,
        last_name,
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
  first_name: normalizeCsvValue(row.first_name) as string,
  last_name: normalizeCsvValue(row.last_name) as string,
  phone: normalizeCsvValue(row.phone),
  date_of_birth: normalizeCsvValue(row.date_of_birth),
  email: normalizeCsvValue(row.email) as string,
  address: normalizeCsvValue(row.address),
  city: normalizeCsvValue(row.city),
  preferred_language: normalizeCsvValue(row.preferred_language) as
    | "en"
    | "ga"
    | undefined,
});

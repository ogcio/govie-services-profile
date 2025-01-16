import { toIsoDate } from "~/utils/index.js";
import type {
  DetailType,
  KnownProfileDataDetails,
  KnownProfileDbDataDetails,
  ProfileWithDetails,
  ProfileWithDetailsFromDb,
} from "./index.js";

export const PROFILES_TAG = "Profiles";

export function parseProfilesDetails(
  inputItems: ProfileWithDetailsFromDb[],
): ProfileWithDetails[] {
  return inputItems.map((i) => parseProfileDetails(i));
}

export function parseProfileDetails(
  inputItem: ProfileWithDetailsFromDb,
): ProfileWithDetails {
  if (!inputItem.details) {
    return { ...inputItem, details: undefined };
  }

  // in this way we extract the keys that exist on this instance
  // without setting undefined additional ones in output
  const keys: (keyof KnownProfileDbDataDetails)[] = Object.keys(
    inputItem.details,
  ) as unknown as (keyof KnownProfileDbDataDetails)[];
  const outputDetails: KnownProfileDataDetails = {};

  for (const key of keys) {
    outputDetails[key] = parseSingleDetail(inputItem.details[key]);
  }

  return { ...inputItem, details: outputDetails };
}

function parseSingleDetail(inputDetail?: {
  type: DetailType;
  value: string;
}): string | undefined {
  if (!inputDetail) {
    return undefined;
  }
  if (inputDetail.type === "date") {
    return toIsoDate(inputDetail.value);
  }
  return inputDetail.value.toString();
}

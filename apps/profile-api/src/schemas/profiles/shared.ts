import { toIsoDate } from "~/utils/index.js";
import type {
  DetailType,
  KnownProfileDataDetails,
  ProfileWithData,
  ProfileWithDataFromDb,
} from "./index.js";

export const PROFILES_TAG = "Profiles";

export function parseProfilesDetails(
  inputItems: ProfileWithDataFromDb[],
): ProfileWithData[] {
  return inputItems.map((i) => parseProfileDetails(i));
}

export function parseProfileDetails(
  inputItem: ProfileWithDataFromDb,
): ProfileWithData {
  if (!inputItem.details) {
    return { ...inputItem, details: undefined };
  }

  const outputDetails: KnownProfileDataDetails = {
    city: parseSingleDetail(inputItem.details.city),
    email: parseSingleDetail(inputItem.details.email),
    address: parseSingleDetail(inputItem.details.address),
    phone: parseSingleDetail(inputItem.details.phone),
    first_name: parseSingleDetail(inputItem.details.first_name),
    last_name: parseSingleDetail(inputItem.details.last_name),
    date_of_birth: parseSingleDetail(inputItem.details.date_of_birth),
    ppsn: parseSingleDetail(inputItem.details.ppsn),
  };

  return { ...inputItem, details: outputDetails };
}

function parseSingleDetail(inputDetail: {
  type: DetailType;
  value: string;
}): string {
  if (inputDetail.type === "date") {
    return toIsoDate(inputDetail.value);
  }
  return inputDetail.value.toString();
}

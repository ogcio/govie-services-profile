import { httpErrors } from "@fastify/sensible";
import type { Record } from "@sinclair/typebox";
import { toIsoDate } from "~/utils/index.js";
import {
  type DetailType,
  type KnownProfileDataDetails,
  type KnownProfileDbDataDetails,
  type MandatoryProfileDataDetails,
  MandatoryProfileDataDetailsSchema,
  type ProfileWithDetails,
  type ProfileWithDetailsFromDb,
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
  const outputDetails: Record<string, string | undefined> = {};

  for (const key of keys) {
    outputDetails[key] = parseSingleDetail(inputItem.details[key]);
  }

  const mandatoryKeys: (keyof MandatoryProfileDataDetails)[] = Object.keys(
    MandatoryProfileDataDetailsSchema.properties,
  ) as unknown as (keyof MandatoryProfileDataDetails)[];

  const mandatoryDetails: Record<string, string> = {};
  for (const key of mandatoryKeys) {
    mandatoryDetails[key] = parseMandatoryDetail(key, inputItem.details[key]);
  }

  return {
    ...inputItem,
    details: {
      ...outputDetails,
      ...mandatoryDetails,
    } as KnownProfileDataDetails,
  };
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

function parseMandatoryDetail(
  propertyName: string,
  inputDetail?: {
    type: DetailType;
    value: string;
  },
): string {
  if (!inputDetail) {
    throw httpErrors.internalServerError(
      `Missing mandatory detail ${propertyName}`,
    );
  }

  return parseSingleDetail(inputDetail) as string;
}

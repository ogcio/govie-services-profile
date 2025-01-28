import type { HttpError } from "@fastify/sensible";
import { Value } from "@sinclair/typebox/value";
import type { PoolClient } from "pg";
import { KnownProfileDataDetailsSchema } from "~/schemas/profiles/index.js";
import { withRollback } from "~/utils/index.js";
import {
  createProfileDataForProfileDetail,
  createProfileDetails,
  findProfileWithData,
  updateProfileDetailsToLatest,
} from "./sql/index.js";

export class ProfileDetailsError implements HttpError {
  status = 500;
  statusCode = 500;
  expose = true;
  name = "ProfileDetails";
  message = "error working on profile details";

  constructor(message?: string) {
    this.name = message ?? this.name;
  }
}

export const createUpdateProfileDetails = async (
  client: PoolClient,
  organizationId: string | undefined,
  profileId: string,
  data: Record<string, string | number>,
): Promise<string | undefined> => {
  try {
    return await withRollback(client, async () => {
      const profileWithData = await findProfileWithData(
        client,
        organizationId,
        profileId,
      );

      let previousProfileDetails = {};

      if (profileWithData?.details) {
        previousProfileDetails = Object.fromEntries(
          Object.entries(profileWithData.details).map(([key, value]) => [
            key,
            value.value,
          ]),
        );
      }
      const toSetDetails = checkIfProfileDetailsNeedToBeUpdated(
        previousProfileDetails,
        { ...previousProfileDetails, ...data },
      );

      if (!toSetDetails.needsUpdate) {
        return;
      }

      const profileDetailId = await createProfileDetails(
        client,
        profileId,
        organizationId,
      );

      await createProfileDataForProfileDetail(
        client,
        profileDetailId,
        toSetDetails.newDetails,
      );

      await updateProfileDetailsToLatest(
        client,
        profileDetailId,
        organizationId,
        profileId,
      );

      return profileDetailId;
    });
  } catch (error) {
    if (error instanceof ProfileDetailsError) {
      throw error;
    }
    const message =
      error instanceof Error ? error.message : "Unknown error occurred";
    throw new ProfileDetailsError(
      `Failed to create/update profile details: ${message}`,
    );
  }
};

const checkIfProfileDetailsNeedToBeUpdated = (
  previousProfileDetails: Record<string, string>,
  newDetails: Record<string, string | number>,
): { needsUpdate: boolean; newDetails: Record<string, string | number> } => {
  const noEmptyDetails = Object.fromEntries(
    Object.entries(newDetails).filter(
      ([, v]) =>
        !(
          (typeof v === "string" && !v.length) ||
          v === null ||
          typeof v === "undefined"
        ),
    ),
  );

  const cleanedDetails = Value.Clean(
    KnownProfileDataDetailsSchema,
    noEmptyDetails,
  ) as Record<string, string | number>;

  if (
    JSON.stringify(Object.keys(cleanedDetails).sort()) !==
    JSON.stringify(Object.keys(previousProfileDetails).sort())
  ) {
    return { needsUpdate: true, newDetails: cleanedDetails };
  }

  for (const newKey in cleanedDetails) {
    if (
      !previousProfileDetails[newKey] ||
      cleanedDetails[newKey] !== previousProfileDetails[newKey]
    ) {
      return { needsUpdate: true, newDetails: cleanedDetails };
    }
  }

  return { needsUpdate: false, newDetails: cleanedDetails };
};

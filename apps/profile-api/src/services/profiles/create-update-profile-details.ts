import type { HttpError } from "@fastify/sensible";
import type { PoolClient } from "pg";
import { withRollback } from "~/utils/index.js";
import {
  createProfileDataForProfileDetail,
  createProfileDetails,
  updateProfileDetails,
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
  organizationId: string,
  profileId: string,
  data: Record<string, string | number>,
): Promise<string> => {
  try {
    return await withRollback(client, async () => {
      const profileDetailId = await createProfileDetails(
        client,
        profileId,
        organizationId,
      );

      await createProfileDataForProfileDetail(client, profileDetailId, data);

      await updateProfileDetails(
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

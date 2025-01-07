import { httpErrors } from "@fastify/sensible";
import type { PoolClient } from "pg";
import { withRollback } from "~/utils/with-rollback.js";
import {
  createProfileDataForProfileDetail,
  createProfileDetails,
  updateProfileDetails,
} from "./sql/index.js";

export class ProfileDetailsError extends httpErrors.HttpError {
  constructor(message: string) {
    super(message);
    this.name = "ProfileDetailsError";
    this.statusCode = 500;
    this.status = 500;
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
      if (!profileDetailId) {
        throw new ProfileDetailsError("Failed to create profile details");
      }

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

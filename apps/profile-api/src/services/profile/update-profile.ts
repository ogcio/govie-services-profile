import { httpErrors } from "@fastify/sensible";
import type { Pool } from "pg";
import type {
  ProfilesIndexResponse,
  UpdateProfileBody,
} from "~/schemas/profiles/index.js";
import { withClient } from "~/utils/with-client.js";
import { createUpdateProfileDetails } from "./create-update-profile-details.js";
import { findProfileWithData } from "./sql/find-profile-with-data.js";
import { createProfile } from "./sql/index.js";

export const updateProfile = async (
  pool: Pool,
  profileId: string,
  organizationId: string,
  data: UpdateProfileBody,
): Promise<ProfilesIndexResponse> => {
  const { public_name, email } = data;

  // First verify profile exists and user has access
  const existingProfile = await findProfileWithData(
    pool,
    organizationId,
    profileId,
  );

  if (!existingProfile) {
    throw httpErrors.notFound(`Profile ${profileId} not found`);
  }

  // Update profile using transaction
  withClient(pool, async (client) => {
    // Update base profile fields if provided
    if (email || public_name) {
      await createProfile(client, {
        id: profileId,
        email: email || existingProfile.email,
        public_name: public_name || existingProfile.public_name,
        primary_user_id: existingProfile.primary_user_id,
        safe_level: 0,
      });
    }

    // Create new profile details with updated data
    await createUpdateProfileDetails(client, organizationId, profileId, data);
  });

  // Return updated profile
  return await findProfileWithData(pool, organizationId, profileId);
};

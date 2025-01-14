import { httpErrors } from "@fastify/sensible";
import type { Pool } from "pg";
import type {
  ProfileWithData,
  UpdateProfileBody,
} from "~/schemas/profiles/index.js";
import { withClient } from "~/utils/with-client.js";
import { createUpdateProfileDetails } from "./create-update-profile-details.js";
import { findProfileWithData } from "./sql/find-profile-with-data.js";
import { updateProfile } from "./sql/index.js";

export const patchProfile = async (params: {
  pool: Pool;
  profileId: string;
  organizationId: string;
  data: UpdateProfileBody;
}): Promise<ProfileWithData> =>
  withClient(params.pool, async (client) => {
    const { profileId, organizationId, data } = params;

    const existingProfile = await findProfileWithData(
      client,
      organizationId,
      profileId,
    );

    if (!existingProfile) {
      throw httpErrors.notFound(`Profile ${profileId} not found`);
    }

    const { email, public_name } = data;

    // Update base profile fields if provided
    if (email || public_name) {
      await updateProfile(client, profileId, public_name ?? "", email ?? "");
    }

    // Create new profile details with updated data
    await createUpdateProfileDetails(client, organizationId, profileId, data);
    return await findProfileWithData(client, organizationId, profileId);
  });

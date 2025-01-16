import { httpErrors } from "@fastify/sensible";
import type { Pool } from "pg";
import type {
  ProfileWithData,
  UpdateProfileBody,
} from "~/schemas/profiles/index.js";
import { withClient } from "~/utils/index.js";
import { createUpdateProfileDetails } from "./index.js";
import {
  findProfileWithData,
  updateProfile as updateProfileSql,
} from "./sql/index.js";

export const updateProfile = async (params: {
  pool: Pool;
  profileId: string;
  data: UpdateProfileBody;
  organizationId?: string;
}): Promise<ProfileWithData | undefined> =>
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
    const souldUpdateEmail = email && email !== existingProfile.email;
    const shouldUpdatePublicName =
      public_name && public_name !== existingProfile.public_name;
    const shouldUpdateProfile = souldUpdateEmail || shouldUpdatePublicName;

    // Update base profile fields if provided
    if (shouldUpdateProfile) {
      await updateProfileSql(
        client,
        profileId,
        public_name ?? existingProfile.public_name,
        email ?? existingProfile.email,
      );
    }

    // Create new profile details with updated data
    await createUpdateProfileDetails(client, organizationId, profileId, data);
    return findProfileWithData(client, organizationId, profileId);
  });

import { httpErrors } from "@fastify/sensible";
import type { Pool } from "pg";
import type { ProfileWithData } from "~/schemas/profiles/index.js";
import { withClient } from "~/utils/index.js";
import { findProfileWithData } from "./sql/index.js";

export const getProfile = async (params: {
  pool: Pool;
  organizationId: string | undefined;
  profileId: string;
}): Promise<ProfileWithData> => {
  const profileData = await withClient(params.pool, async (client) =>
    findProfileWithData(client, params.organizationId, params.profileId),
  );

  if (!profileData) {
    throw httpErrors.notFound(`Profile ${params.profileId} not found`);
  }

  return profileData;
};

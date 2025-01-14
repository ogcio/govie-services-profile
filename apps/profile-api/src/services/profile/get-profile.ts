import type { Pool } from "pg";
import type { ProfileWithData } from "~/schemas/profiles/index.js";
import { withClient } from "~/utils/with-client.js";
import { findProfileWithData } from "./sql/find-profile-with-data.js";

export const getProfile = async (params: {
  pool: Pool;
  organizationId: string;
  profileId: string;
}): Promise<ProfileWithData> =>
  withClient(params.pool, async (client) => {
    return await findProfileWithData(
      client,
      params.organizationId,
      params.profileId,
    );
  });

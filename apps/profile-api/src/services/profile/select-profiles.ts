import type { Pool } from "pg";
import type { ProfileWithData } from "~/types/profile.js";
import { withClient } from "~/utils/with-client.js";
import { selectProfilesWithData } from "./sql/select-profiles-with-data.js";

export const selectProfiles = async (params: {
  pool: Pool;
  organizationId: string;
  profileIds: string[];
}): Promise<ProfileWithData[]> =>
  withClient(params.pool, async (client) => {
    return await selectProfilesWithData(
      client,
      params.organizationId,
      params.profileIds,
    );
  });

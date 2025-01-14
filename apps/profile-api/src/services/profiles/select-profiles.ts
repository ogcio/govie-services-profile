import type { Pool } from "pg";
import type { ProfileWithDataList } from "~/schemas/profiles/index.js";
import { withClient } from "~/utils/index.js";
import { selectProfilesWithData } from "./sql/index.js";

export const selectProfiles = async (params: {
  pool: Pool;
  organizationId: string;
  profileIds: string[];
}): Promise<ProfileWithDataList> =>
  withClient(
    params.pool,
    async (client) =>
      await selectProfilesWithData(
        client,
        params.organizationId,
        params.profileIds,
      ),
  );

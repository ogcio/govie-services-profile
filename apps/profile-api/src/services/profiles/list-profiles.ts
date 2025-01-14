import type { Pool } from "pg";
import type { PaginationParams } from "~/schemas/pagination.js";
import type {
  ProfileWithData,
  ProfileWithDataList,
} from "~/schemas/profiles/index.js";
import { withClient } from "~/utils/with-client.js";
import { buildlistProfilesQueries } from "./sql/list-profiles.js";

export const listProfiles = async (params: {
  pool: Pool;
  organisationId: string;
  pagination: Required<PaginationParams>;
  search?: string | undefined;
  activeOnly?: boolean;
}): Promise<{ data: ProfileWithDataList; total: number }> =>
  withClient(params.pool, async (client) => {
    const queries = buildlistProfilesQueries(params);

    const countResponse = client.query<{ count: number }>(
      queries.count.query,
      queries.count.values,
    );
    const response = client.query<ProfileWithData>(
      queries.data.query,
      queries.data.values,
    );

    return {
      data: (await response).rows,
      total: (await countResponse).rows[0].count,
    };
  });

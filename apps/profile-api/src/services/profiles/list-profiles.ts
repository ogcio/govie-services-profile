import type { Pool } from "pg";
import type { PaginationParams } from "~/schemas/pagination.js";
import type { ProfileList, ProfileWithData } from "~/schemas/profiles/index.js";
import { withClient } from "~/utils/index.js";
import { buildListProfilesQueries } from "./sql/index.js";

export const listProfiles = async (params: {
  pool: Pool;
  organisationId: string;
  pagination: Required<PaginationParams>;
  search?: string | undefined;
  activeOnly?: boolean;
}): Promise<{ data: ProfileList; total: number }> =>
  withClient(params.pool, async (client) => {
    const queries = buildListProfilesQueries(params);

    const countResponse = await client.query<{ count: number }>(
      queries.count.query,
      queries.count.values,
    );

    if (countResponse.rows.length === 0 || countResponse.rows[0].count === 0) {
      return {
        data: [],
        total: 0,
      };
    }

    const response = await client.query<ProfileWithData>(
      queries.data.query,
      queries.data.values,
    );

    return {
      data: response.rows,
      total: countResponse.rows[0].count,
    };
  });

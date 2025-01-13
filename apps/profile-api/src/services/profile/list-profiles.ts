import { httpErrors } from "@fastify/sensible";
import type { Pool } from "pg";
import type { PaginationParams } from "~/schemas/pagination.js";
import type { ProfileWithData } from "~/types/profile.js";
import { buildlistProfilesQueries } from "./sql/list-profiles.js";

export const listProfiles = async (params: {
  pool: Pool;
  organisationId: string;
  pagination: Required<PaginationParams>;
  search?: string | undefined;
  activeOnly?: boolean;
}): Promise<{ data: ProfileWithData[]; total: number }> => {
  const client = await params.pool.connect();
  try {
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
  } catch (error) {
    throw httpErrors.createError(500, "error fetching profiles", {
      parent: error,
    });
  } finally {
    client.release();
  }
};

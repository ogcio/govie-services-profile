import type { PoolClient } from "pg";

export const createProfileDetails = async (
  client: PoolClient,
  profileId: string,
  organizationId: string,
) => {
  const query = `INSERT INTO profile_details(
        profile_id,
        organisation_id,
        is_latest
    ) VALUES ($1, $2, $3, $4) RETURNING id;`;

  const values = [profileId, organizationId, true];

  const result = await client.query<{ id: string }>(query, values);
  return result.rows[0]?.id;
};

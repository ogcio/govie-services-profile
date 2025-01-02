import type { PoolClient } from "pg";
import type { ImportProfilesBody } from "~/schemas/profiles/import.js";

export const createProfileDetails = async (
  client: PoolClient,
  profileId: string,
  organizationId: string,
  details: ImportProfilesBody[0],
) => {
  const query = `INSERT INTO profile_details(
        profile_id,
        organisation_id,
        details,
        is_latest
    ) VALUES ($1, $2, $3, $4) RETURNING id;`;

  const values = [profileId, organizationId, details, true];

  const result = await client.query<{ id: string }>(query, values);
  return result.rows[0]?.id;
};

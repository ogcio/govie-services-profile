import type { PoolClient } from "pg";

export const updateProfileDetailsToLatest = async (
  client: PoolClient,
  profileDetailId: string,
  organizationId: string | undefined,
  profileId: string,
): Promise<void> => {
  let organizationClause = " IS NULL ";
  const values = [profileDetailId, profileId];
  if (organizationId !== undefined) {
    organizationClause = "= $3 ";
    values.push(organizationId);
  }

  const query = `
    UPDATE profile_details 
      SET is_latest = false 
      WHERE id <> $1 
      AND profile_id = $2
      AND organisation_id ${organizationClause};
      `;

  await client.query(query, values);
};

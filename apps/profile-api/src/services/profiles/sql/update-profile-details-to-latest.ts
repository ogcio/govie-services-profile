import type { PoolClient } from "pg";

export const updateProfileDetailsToLatest = async (
  client: PoolClient,
  profileDetailId: string,
  organizationId: string | undefined,
  profileId: string,
): Promise<void> => {
  const query =
    "UPDATE profile_details SET is_latest = false WHERE id <> $1 AND organisation_id = $2 AND profile_id = $3;";

  const values = [profileDetailId, organizationId, profileId];

  await client.query(query, values);
};

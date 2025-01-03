import type { PoolClient } from "pg";

export const createProfileDetailData = async (
  client: PoolClient,
  profileId: string,
  data: Record<string, string | number>,
) => {
  const query = `
INSERT INTO profile_data (profile_details_id, name, value_type, value)
VALUES ($1, $2, 'string', $3);`;

  const values = [profileId, JSON.stringify(data)];

  await client.query<{ id: string }>(query, values);
};

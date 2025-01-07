import type { PoolClient } from "pg";

export const findProfileDataByEmail = async (
  client: PoolClient,
  email: string,
): Promise<string | undefined> => {
  const query =
    "SELECT profile_details_id FROM profile_data WHERE value = $1 AND value_type = 'string';";
  const values = [email];
  const result = await client.query<{ profile_details_id: string }>(
    query,
    values,
  );
  return result.rows[0]?.profile_details_id;
};

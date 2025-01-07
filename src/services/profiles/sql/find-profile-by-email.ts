import type { PoolClient } from "pg";

export const findProfileByEmail = async (
  client: PoolClient,
  email: string,
): Promise<string | undefined> => {
  const query = "SELECT id FROM profiles WHERE email = $1;";
  const values = [email];

  const result = await client.query<{ id: string }>(query, values);
  return result.rows[0]?.id;
};

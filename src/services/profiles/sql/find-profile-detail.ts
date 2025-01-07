import type { PoolClient } from "pg";

export const findProfileDetail = async (
  client: PoolClient,
  profileDetailId: string,
): Promise<string | undefined> => {
  const query = `
          SELECT profile_id
          FROM profile_details
          WHERE id = $1;
        `;
  const values = [profileDetailId];
  const result = await client.query<{ profile_id: string }>(query, values);
  return result.rows[0]?.profile_id;
};

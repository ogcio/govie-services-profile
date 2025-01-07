import type { PoolClient } from "pg";
import type { ProfileTable } from "~/types/profile.js";

export const createProfile = async (
  client: PoolClient,
  profile: ProfileTable,
) => {
  // The values where we use COALESCE
  // are the ones that currently are not mapped
  // using the webhook body. Then, if a value
  // is set in another way, just use it
  const query = `
    INSERT INTO profiles
        (
          id,
          public_name,
          email,
          primary_user_id,
          safe_level
        )
    VALUES
        (
            $1, $2, $3, $4, $5
        )
    ON CONFLICT(id) 
    DO UPDATE SET
        public_name = EXCLUDED.public_name,
        email = EXCLUDED.email,
        safe_level = EXCLUDED.safe_level
    RETURNING id;
  `;

  const values = [
    profile.id,
    profile.public_name,
    profile.email,
    profile.primary_user_id,
    profile.safe_level,
  ];

  const result = await client.query<{ id: string }>(query, values);
  return result.rows[0]?.id;
};

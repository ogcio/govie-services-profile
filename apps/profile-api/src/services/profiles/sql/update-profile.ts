import type { PoolClient } from "pg";

export const updateProfile = async (
  client: PoolClient,
  profileId: string,
  publicName: string,
  email: string,
) => {
  await client.query(
    "UPDATE profiles SET public_name = $1, email = $2, updated_at = $3 WHERE id = $4",
    [publicName, email, new Date(), profileId],
  );
};

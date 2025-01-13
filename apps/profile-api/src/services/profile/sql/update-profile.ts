import type { PoolClient } from "pg";

export const updateProfile = async (
  client: PoolClient,
  profileId: string,
  publicName: string,
  email: string,
) => {
  await client.query(
    "UPDATE profiles SET public_name = $1, email = $2 WHERE id = $3",
    [publicName, email, profileId],
  );
};

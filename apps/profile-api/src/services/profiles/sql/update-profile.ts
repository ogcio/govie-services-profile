import type { PoolClient } from "pg";

export const updateProfile = async (
  client: PoolClient,
  profileId: string,
  publicName: string,
  email: string,
  preferredLanguage?: string,
) => {
  await client.query(
    "UPDATE profiles SET public_name = $1, email = $2, preferred_language = COALESCE($3, preferred_language), updated_at = $4 WHERE id = $5",
    [publicName, email, preferredLanguage, new Date(), profileId],
  );
};

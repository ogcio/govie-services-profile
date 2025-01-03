import type { PoolClient } from "pg";
import type { ImportProfilesBody } from "~/schemas/profiles/import.js";

export const getImportDataForUserEmail = async (
  client: PoolClient,
  profileImportId: string,
  email: string,
) => {
  const result = await client.query<{ profile: ImportProfilesBody[0] }>(
    `
SELECT data as profile
FROM profile_import_details
WHERE profile_import_id = $1 AND data->>'email' = $2 LIMIT 1;`,
    [profileImportId, email],
  );

  return result.rows[0].profile;
};

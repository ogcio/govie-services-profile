import type { PoolClient } from "pg";
import type { ImportProfilesBody } from "~/schemas/profiles/import.js";

export const getImportDataForUserEmail = async (
  client: PoolClient,
  organisationId: string,
  jobId: string,
  email: string,
) => {
  const result = await client.query<{ profile: ImportProfilesBody[0] }>(
    `
SELECT arr.item_object as profile
FROM profile_imports,
jsonb_array_elements(data) with ordinality arr(item_object, position) 
WHERE organisation_id = $1 AND job_id = $2 AND item_object->>'email' = $3 LIMIT 1;`,
    [organisationId, jobId, email],
  );

  return result.rows[0].profile;
};

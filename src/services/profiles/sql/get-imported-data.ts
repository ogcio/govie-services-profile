import type { PoolClient } from "pg";

export const getImportData = async (
  client: PoolClient,
  organisationId: string,
  jobId: string,
) => {
  const result = await client.query<{ position: number; profile: string }>(
    `
SELECT arr.position, arr.item_object as profile
FROM profile_imports,
jsonb_array_elements(data) with ordinality arr(item_object, position) 
WHERE organisation_id = $1 AND job_id = $2;`,
    [organisationId, jobId],
  );

  return result.rows.map((row) => row.profile);
};

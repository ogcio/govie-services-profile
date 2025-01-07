import type { PoolClient } from "pg";

export const findProfileImportByJobId = async (
  client: PoolClient,
  jobId: string,
) => {
  const result = await client.query<{ id: string }>(
    "SELECT id FROM profile_imports WHERE job_id = $1;",
    [jobId],
  );

  return result.rows[0]?.id;
};

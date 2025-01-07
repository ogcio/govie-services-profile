import type { PoolClient } from "pg";

export const getProfileImportStatus = async (
  client: PoolClient,
  jobId: string,
) => {
  const result = await client.query(
    "SELECT status FROM profile_imports WHERE job_id = $1;",
    [jobId],
  );

  return result.rows[0]?.status;
};

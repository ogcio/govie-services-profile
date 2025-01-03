import type { PoolClient } from "pg";

export const markImportStatus = async (
  client: PoolClient,
  jobId: string,
  status = "failed",
) => {
  await client.query(
    "UPDATE profile_imports SET status = $1 WHERE job_id = $2;",
    [status, jobId],
  );
};

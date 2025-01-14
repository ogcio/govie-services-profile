import type { PoolClient } from "pg";

export const updateProfileImportStatusByJobId = async (
  client: PoolClient,
  jobId: string,
  status = "failed",
): Promise<void> => {
  await client.query(
    "UPDATE profile_imports SET status = $1 WHERE job_id = $2;",
    [status, jobId],
  );
};

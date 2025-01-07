import type { PoolClient } from "pg";
import { ImportStatus } from "~/const/profile.js";

const FINAL_STATUSES = [
  ImportStatus.COMPLETED,
  ImportStatus.FAILED,
  ImportStatus.CANCELLED,
  ImportStatus.UNRECOVERABLE,
];

export const checkImportCompletion = async (
  client: PoolClient,
  jobId: string,
) => {
  // Get total count and count of profiles in final states
  const result = await client.query<{
    total: number;
    completed: number;
    failed: number;
  }>(
    `
    WITH counts AS (
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE d.status = ANY($1)) as completed,
        COUNT(*) FILTER (WHERE d.status IN ('failed', 'unrecoverable')) as failed
      FROM profile_import_details d
      JOIN profile_imports i ON i.id = d.profile_import_id
      WHERE i.job_id = $2
    )
    SELECT * FROM counts;
    `,
    [FINAL_STATUSES, jobId],
  );

  const { total, completed, failed } = result.rows[0];

  // If all profiles are in a final state, determine overall status
  if (total === completed) {
    return {
      isComplete: true,
      finalStatus:
        failed === total ? ImportStatus.FAILED : ImportStatus.COMPLETED,
    };
  }

  return {
    isComplete: false,
    finalStatus: ImportStatus.PROCESSING,
  };
};

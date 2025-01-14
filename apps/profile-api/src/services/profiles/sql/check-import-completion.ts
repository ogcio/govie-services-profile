import type { PoolClient } from "pg";
import { ImportStatus } from "~/const/index.js";

export const checkImportCompletion = async (
  client: PoolClient,
  jobId: string,
): Promise<{ isComplete: boolean; finalStatus: ImportStatus }> => {
  // Get total count and count of profiles in final states
  const result = await client.query<{
    total: number;
    completed: number;
    failed: number;
    pending: number;
  }>(
    "WITH counts AS (" +
      "  SELECT " +
      "    COUNT(*)::INTEGER as total, " +
      "    COUNT(*) FILTER (WHERE d.status = 'completed')::INTEGER as completed, " +
      "    COUNT(*) FILTER (WHERE d.status = 'failed' OR d.status = 'unrecoverable')::INTEGER as failed, " +
      "    COUNT(*) FILTER (WHERE d.status = 'pending')::INTEGER as pending " +
      "  FROM profile_import_details d " +
      "  JOIN profile_imports i ON i.id = d.profile_import_id " +
      "  WHERE i.job_id = $1" +
      ") " +
      "SELECT * FROM counts",
    [jobId],
  );

  const { total, completed, failed, pending } = result.rows[0];

  // If there are no pending profiles and all are in final state
  if (pending === 0 && total === completed + failed) {
    return {
      isComplete: true,
      finalStatus:
        failed > 0 && failed === total
          ? ImportStatus.FAILED
          : ImportStatus.COMPLETED,
    };
  }

  return {
    isComplete: false,
    finalStatus: ImportStatus.PROCESSING,
  };
};

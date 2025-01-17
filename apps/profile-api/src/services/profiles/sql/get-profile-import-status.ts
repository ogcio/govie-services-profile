import { httpErrors } from "@fastify/sensible";
import type { PoolClient } from "pg";
import type { ImportStatus } from "~/const/index.js";

export const getProfileImportStatus = async (
  client: PoolClient,
  jobId: string,
): Promise<ImportStatus> => {
  const result = await client.query<{ status: string }>(
    "SELECT status FROM profile_imports WHERE job_id = $1 LIMIT 1;",
    [jobId],
  );

  if (!result.rows[0]?.status) {
    throw httpErrors.notFound(
      `Status for profile_import with id ${jobId} not found`,
    );
  }

  return result.rows[0].status as ImportStatus;
};

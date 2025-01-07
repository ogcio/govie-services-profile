import crypto from "node:crypto";
import type { PoolClient } from "pg";

export const createProfileImport = async (
  client: PoolClient,
  organisationId: string,
) => {
  const jobId = crypto.randomBytes(16).toString("hex");
  await client.query<{ id: string }>(
    "INSERT INTO profile_imports (job_id, organisation_id) VALUES ($1, $2) RETURNING id;",
    [jobId, organisationId],
  );

  return jobId;
};

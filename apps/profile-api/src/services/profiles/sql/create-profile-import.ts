import crypto from "node:crypto";
import { httpErrors } from "@fastify/sensible";
import type { PoolClient } from "pg";

export const createProfileImport = async (
  client: PoolClient,
  organisationId: string,
): Promise<string> => {
  const jobId = crypto.randomBytes(16).toString("hex");
  const response = await client.query<{ id: string }>(
    "INSERT INTO profile_imports (job_id, organisation_id) VALUES ($1, $2) RETURNING id;",
    [jobId, organisationId],
  );

  if (!response.rows[0]?.id) {
    throw httpErrors.internalServerError("Cannot insert profile import!");
  }

  return jobId;
};

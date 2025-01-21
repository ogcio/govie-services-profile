import crypto from "node:crypto";
import { httpErrors } from "@fastify/sensible";
import type { PoolClient } from "pg";
import type { SavedFileInfo } from "~/utils/save-request-file.js";

export const createProfileImport = async (
  client: PoolClient,
  organisationId: string,
  source: "json" | "csv" = "csv",
  metadata?: SavedFileInfo["metadata"],
): Promise<string> => {
  const jobId = crypto.randomBytes(16).toString("hex");
  const response = await client.query<{ id: string }>(
    "INSERT INTO profile_imports (job_id, organisation_id, source, metadata) VALUES ($1, $2, $3, $4) RETURNING id;",
    [jobId, organisationId, source, metadata ? JSON.stringify(metadata) : "{}"],
  );

  if (!response.rows[0]?.id) {
    throw httpErrors.internalServerError("Cannot insert profile import!");
  }

  return jobId;
};

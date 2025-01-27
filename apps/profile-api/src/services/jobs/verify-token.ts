import type { FastifyBaseLogger } from "fastify";
import type { Pool } from "pg";
import { withClient } from "~/utils/with-client.js";
import { getJobTokenForProfileImport } from "../profiles/sql/get-job-token-for-profile-import.js";

export const verifyToken = async (params: {
  pool: Pool;
  logger: FastifyBaseLogger;
  profileImportId: string;
  token: string;
}): Promise<boolean> => {
  const { profileImportId, token } = params;
  return withClient(params.pool, async (client) => {
    const jobToken = await getJobTokenForProfileImport(client, profileImportId);
    if (!jobToken) {
      return false;
    }
    return jobToken === token;
  });
};

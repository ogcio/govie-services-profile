import { httpErrors } from "@fastify/sensible";
import type { FastifyPluginAsyncTypebox } from "@fastify/type-provider-typebox";
import type { FastifyInstance } from "fastify";
import { ExecuteJobReqSchema } from "~/schemas/jobs.js";
import type { FastifyRequestTypebox } from "~/schemas/shared.js";
import { verifyToken } from "~/services/jobs/verify-token.js";
import { executeImportProfiles } from "~/services/profiles/import-profiles.js";

const plugin: FastifyPluginAsyncTypebox = async (fastify: FastifyInstance) => {
  fastify.post(
    "/import-profiles/:profileImportId",
    {
      schema: ExecuteJobReqSchema,
    },
    async (request: FastifyRequestTypebox<typeof ExecuteJobReqSchema>) => {
      const { profileImportId } = request.params;
      const { token } = request.body;

      // Verify token
      const isTokenVerified = await verifyToken({
        pool: fastify.pg.pool,
        logger: request.log,
        profileImportId,
        token,
      });
      if (!isTokenVerified) {
        throw httpErrors.unauthorized("Invalid token");
      }
      // Execute job
      return executeImportProfiles({
        pool: fastify.pg.pool,
        logger: request.log,
        profileImportId,
        config: fastify.config,
      });
    },
  );
};

export default plugin;
export const autoPrefix = "/api/v1/jobs";

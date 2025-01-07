import type { FastifyPluginAsyncTypebox } from "@fastify/type-provider-typebox";
import type { FastifyInstance } from "fastify";
import { ImportProfilesSchema } from "~/schemas/profiles/import.js";
import type { FastifyRequestTypebox } from "~/schemas/shared.js";
import { processClientImport } from "~/services/profiles/process-client-import.js";

const plugin: FastifyPluginAsyncTypebox = async (fastify: FastifyInstance) => {
  fastify.post(
    "/import",
    {
      // preValidation: (req, res) =>
      //   app.checkPermissions(req, res, [Permissions.Admin.Write]),
      schema: ImportProfilesSchema,
    },
    async (request: FastifyRequestTypebox<typeof ImportProfilesSchema>) => {
      const importStatus = await processClientImport(
        fastify,
        request.body,
        request.query.organizationId,
      );

      return { status: importStatus };
    },
  );
};

export default plugin;
export const autoPrefix = "/api/v1/profiles";

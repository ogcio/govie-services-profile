import { httpErrors } from "@fastify/sensible";
import type { FastifyPluginAsyncTypebox } from "@fastify/type-provider-typebox";
import type { FastifyInstance } from "fastify";
import { Permissions } from "~/const/permissions.js";
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

  fastify.get(
    "/import",
    {
      preValidation: (req, res) =>
        fastify.checkPermissions(req, res, [Permissions.User.Read]),
    },
    async () => {
      throw httpErrors.imateapot();
    },
  );
};

export default plugin;
export const autoPrefix = "/api/v1/profiles";

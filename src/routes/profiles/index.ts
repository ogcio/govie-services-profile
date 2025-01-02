import type { FastifyPluginAsyncTypebox } from "@fastify/type-provider-typebox";
import { Type } from "@sinclair/typebox";
import type { FastifyInstance, FastifyRequest } from "fastify";
import { processProfilesImport } from "~/services/profiles/index.js";
import { HttpError } from "~/types/http-error.js";
import { type ImportProfiles, ImportProfilesSchema } from "~/types/profile.js";

const PROFILE_TAGS = ["Profiles"];

type PostProfilesImportRequest = {
  Body: ImportProfiles;
  Reply: null;
  Querystring: { organizationId: string };
};

export const autoPrefix = "/api/v1/profiles";

const plugin: FastifyPluginAsyncTypebox = async (fastify: FastifyInstance) => {
  fastify.post<PostProfilesImportRequest>(
    "/import",
    {
      // preValidation: (req, res) =>
      //   app.checkPermissions(req, res, [Permissions.Admin.Write]),
      schema: {
        tags: PROFILE_TAGS,
        body: ImportProfilesSchema,
        querystring: Type.Object({ organizationId: Type.String() }),
        response: {
          200: Type.Null(),
          "5xx": HttpError,
          "4xx": HttpError,
        },
      },
    },
    async (request: FastifyRequest<PostProfilesImportRequest>) => {
      await processProfilesImport(
        fastify,
        request.body,
        request.query.organizationId,
      );
    },
  );
};

export default plugin;

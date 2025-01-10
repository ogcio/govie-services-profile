import { httpErrors } from "@fastify/sensible";
import type { FastifyPluginAsyncTypebox } from "@fastify/type-provider-typebox";
import type { FastifyInstance } from "fastify";
import { Permissions } from "~/const/permissions.js";
import { FindProfileSchema } from "~/schemas/profiles/find-profile.js";
import { ImportProfilesSchema } from "~/schemas/profiles/import.js";
import { ProfilesIndexSchema } from "~/schemas/profiles/index.js";
import type { FastifyRequestTypebox } from "~/schemas/shared.js";
import { findProfile } from "~/services/profile/find-profile.js";
import { listProfiles } from "~/services/profile/list-profiles.js";
import { processClientImport } from "~/services/profile/process-client-import.js";
import { formatAPIResponse } from "~/utils/format-api-response.js";
import { sanitizePagination } from "~/utils/pagination.js";
import { withOrganizationId } from "~/utils/with-organization-id.js";

const plugin: FastifyPluginAsyncTypebox = async (fastify: FastifyInstance) => {
  const {
    pg: { pool },
    config,
  } = fastify;

  fastify.get(
    "/",
    {
      preValidation: (req, res) =>
        fastify.checkPermissions(req, res, [Permissions.User.Read]),
      schema: ProfilesIndexSchema,
    },
    async (request: FastifyRequestTypebox<typeof ProfilesIndexSchema>) => {
      const { data, total: totalCount } = await listProfiles({
        pool,
        organisationId: withOrganizationId(request),
        search: request.query.search,
        pagination: sanitizePagination(request.query),
      });

      return formatAPIResponse({
        data,
        config,
        request,
        totalCount,
      });
    },
  );

  fastify.post(
    "/import-profiles",
    {
      preValidation: (req, res) =>
        fastify.checkPermissions(req, res, [Permissions.User.Read]),
      schema: ImportProfilesSchema,
    },
    async (request: FastifyRequestTypebox<typeof ImportProfilesSchema>) => {
      if (request.body.length === 0) {
        throw httpErrors.badRequest("Profiles array cannot be empty");
      }

      const importStatus = await processClientImport({
        profiles: request.body,
        organizationId: request.query.organizationId,
        logger: request.log,
        config,
        pool,
      });

      return { status: importStatus };
    },
  );

  fastify.get(
    "/find-profile",
    {
      preValidation: (req, res) =>
        fastify.checkPermissions(req, res, [Permissions.User.Read]),
      schema: FindProfileSchema,
    },
    async (request: FastifyRequestTypebox<typeof FindProfileSchema>) => {
      return findProfile({
        pool,
        organizationId: withOrganizationId(request),
        query: request.query,
      });
    },
  );
};

export default plugin;
export const autoPrefix = "/api/v1/profiles";

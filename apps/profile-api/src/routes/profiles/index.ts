import { httpErrors } from "@fastify/sensible";
import type { FastifyPluginAsyncTypebox } from "@fastify/type-provider-typebox";
import type { FastifyInstance } from "fastify";
import { Permissions } from "~/const/permissions.js";
import { FindProfileSchema } from "~/schemas/profiles/find-profile.js";
import { ImportProfilesSchema } from "~/schemas/profiles/import-profiles.js";
import {
  GetProfileSchema,
  ProfilesIndexSchema,
  SelectProfilesSchema,
} from "~/schemas/profiles/index.js";
import type { FastifyRequestTypebox } from "~/schemas/shared.js";
import { findProfile } from "~/services/profile/find-profile.js";
import { listProfiles } from "~/services/profile/list-profiles.js";
import { processClientImport } from "~/services/profile/process-client-import.js";
import { findProfileWithData } from "~/services/profile/sql/find-profile-with-data.js";
import { selectProfilesWithData } from "~/services/profile/sql/select-profiles-with-data.js";
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
        fastify.checkPermissions(req, res, [Permissions.User.Write]),
      schema: ImportProfilesSchema,
    },
    async (request: FastifyRequestTypebox<typeof ImportProfilesSchema>) => {
      if (request.body.length === 0) {
        throw httpErrors.badRequest("Profiles array cannot be empty");
      }

      const importStatus = await processClientImport({
        profiles: request.body,
        organizationId: withOrganizationId(request),
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

  fastify.get(
    "/:profileId",
    {
      preValidation: (req, res) =>
        fastify.checkPermissions(req, res, [Permissions.User.Read]),
      schema: GetProfileSchema,
    },
    async (request: FastifyRequestTypebox<typeof GetProfileSchema>) => {
      const organizationId = withOrganizationId(request);
      const { profileId } = request.params;

      return findProfileWithData(pool, organizationId, profileId);
    },
  );

  fastify.get(
    "/select-profiles",
    {
      preValidation: (req, res) =>
        fastify.checkPermissions(req, res, [Permissions.User.Read]),
      schema: SelectProfilesSchema,
    },
    async (request: FastifyRequestTypebox<typeof SelectProfilesSchema>) => {
      const organizationId = withOrganizationId(request);
      const profileIds = request.query.ids.split(",");

      const profiles = await selectProfilesWithData(
        pool,
        organizationId,
        profileIds,
      );

      return formatAPIResponse({
        data: profiles,
        config,
        request,
        totalCount: profiles.length,
      });
    },
  );
};

export default plugin;
export const autoPrefix = "/api/v1/profiles";

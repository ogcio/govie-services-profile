import { httpErrors } from "@fastify/sensible";
import type { FastifyPluginAsyncTypebox } from "@fastify/type-provider-typebox";
import type { FastifyInstance } from "fastify";
import { Permissions } from "~/const/permissions.js";
import { FindProfileSchema } from "~/schemas/profiles/find-profile.js";
import { ImportProfilesSchema } from "~/schemas/profiles/import-profiles.js";
import {
  GetProfileSchema,
  type ProfileWithData,
  ProfilesIndexSchema,
  SelectProfilesSchema,
  UpdateProfileSchema,
} from "~/schemas/profiles/index.js";
import type { FastifyRequestTypebox } from "~/schemas/shared.js";
import { findProfile } from "~/services/profile/find-profile.js";
import { getProfile } from "~/services/profile/get-profile.js";
import { listProfiles } from "~/services/profile/list-profiles.js";
import { patchProfile } from "~/services/profile/patch-profile.js";
import { processClientImport } from "~/services/profile/process-client-import.js";
import { selectProfiles } from "~/services/profile/select-profiles.js";
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

      return formatAPIResponse<ProfileWithData>({
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
      console.dir(request.userData, { depth: null });
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
    "/select-profiles",
    {
      preValidation: (req, res) =>
        fastify.checkPermissions(req, res, [Permissions.User.Read]),
      schema: SelectProfilesSchema,
    },
    async (request: FastifyRequestTypebox<typeof SelectProfilesSchema>) => {
      const profiles = await selectProfiles({
        pool,
        organizationId: withOrganizationId(request),
        profileIds: request.query.ids.split(","),
      });

      return formatAPIResponse<ProfileWithData>({
        data: profiles,
        config,
        request,
        totalCount: profiles.length,
      });
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
        fastify.checkPermissions(req, res, [
          Permissions.User.Read,
          Permissions.UserSelf.Read,
        ]),
      schema: GetProfileSchema,
    },
    async (request: FastifyRequestTypebox<typeof GetProfileSchema>) => {
      const organizationId =
        request.userData?.organizationId ?? request.query.organizationId;
      if (!organizationId) {
        throw httpErrors.forbidden("Organization id is not set");
      }

      return getProfile({
        pool,
        organizationId,
        profileId: request.params.profileId,
      });
    },
  );

  fastify.put(
    "/:profileId",
    {
      preValidation: (req, res) =>
        fastify.checkPermissions(req, res, [Permissions.UserSelf.Write]),
      schema: UpdateProfileSchema,
    },
    async (request: FastifyRequestTypebox<typeof UpdateProfileSchema>) => {
      return patchProfile({
        pool,
        profileId: request.params.profileId,
        organizationId: request.query.organizationId,
        data: request.body,
      });
    },
  );
};

export default plugin;
export const autoPrefix = "/api/v1/profiles";

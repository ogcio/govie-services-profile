import { httpErrors } from "@fastify/sensible";
import type { FastifyPluginAsyncTypebox } from "@fastify/type-provider-typebox";
import type { FastifyInstance } from "fastify";
import { Permissions } from "~/const/index.js";
import {
  FindProfileSchema,
  GetProfileSchema,
  ImportProfilesSchema,
  type ProfileWithData,
  ProfilesIndexSchema,
  SelectProfilesSchema,
  UpdateProfileSchema,
} from "~/schemas/profiles/index.js";
import type { FastifyRequestTypebox } from "~/schemas/shared.js";
import {
  findProfile,
  getProfile,
  listProfiles,
  patchProfile,
  processClientImport,
  selectProfiles,
} from "~/services/profiles/index.js";
import {
  formatAPIResponse,
  sanitizePagination,
  withOrganizationId,
} from "~/utils/index.js";

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

  fastify.patch(
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

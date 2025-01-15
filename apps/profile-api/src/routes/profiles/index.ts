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
  importProfiles,
  listProfiles,
  selectProfiles,
  updateProfile,
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
      return {
        status: await importProfiles({
          profiles: request.body,
          organizationId: withOrganizationId(request),
          logger: request.log,
          config,
          pool,
        }),
      };
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
      return {
        data: await findProfile({
          pool,
          organizationId: withOrganizationId(request),
          query: request.query,
        }),
      };
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
    async ({
      userData,
      query: { organizationId },
      params: { profileId },
    }: FastifyRequestTypebox<typeof GetProfileSchema>) => {
      return {
        data: await getProfile({
          pool,
          organizationId: userData?.organizationId ?? organizationId,
          profileId,
        }),
      };
    },
  );

  fastify.put(
    "/:profileId",
    {
      preValidation: (req, res) =>
        fastify.checkPermissions(req, res, [Permissions.UserSelf.Write]),
      schema: {
        operationId: "updateProfilePut",
        ...UpdateProfileSchema,
      },
    },
    async ({
      body: data,
      params: { profileId },
      query: { organizationId },
    }: FastifyRequestTypebox<typeof UpdateProfileSchema>) => {
      return {
        data: await updateProfile({
          pool,
          profileId,
          organizationId,
          data,
        }),
      };
    },
  );

  fastify.patch(
    "/:profileId",
    {
      preValidation: (req, res) =>
        fastify.checkPermissions(req, res, [Permissions.UserSelf.Write]),
      schema: {
        operationId: "updateProfilePatch",
        ...UpdateProfileSchema,
      },
    },
    async ({
      body: data,
      params: { profileId },
      query: { organizationId },
    }: FastifyRequestTypebox<typeof UpdateProfileSchema>) => {
      return {
        data: await updateProfile({
          pool,
          profileId,
          organizationId,
          data,
        }),
      };
    },
  );
};

export default plugin;
export const autoPrefix = "/api/v1/profiles";

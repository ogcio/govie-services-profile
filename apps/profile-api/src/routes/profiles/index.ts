import { httpErrors } from "@fastify/sensible";
import type { FastifyPluginAsyncTypebox } from "@fastify/type-provider-typebox";
import { ensureUserCanAccessUser } from "@ogcio/api-auth";
import type { FastifyInstance, FastifyRequest } from "fastify";
import { Permissions } from "~/const/index.js";
import { MimeTypes } from "~/const/mime-types.js";
import {
  FindProfileSchema,
  GetProfileSchema,
  ImportProfilesSchema,
  type KnownProfileDataDetails,
  type Profile,
  type ProfileWithDetails,
  ProfilesIndexSchema,
  SelectProfilesSchema,
  UpdateProfileSchema,
} from "~/schemas/profiles/index.js";
import type { FastifyRequestTypebox } from "~/schemas/shared.js";
import { getProfilesFromCsv } from "~/services/profiles/get-profiles-from-csv.js";
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
import { saveRequestFile } from "~/utils/save-request-file.js";

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

      return formatAPIResponse<Profile>({
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
      const isJson = request.headers["content-type"]?.startsWith(
        MimeTypes.Json,
      );
      const profiles = isJson
        ? (request.body as KnownProfileDataDetails[])
        : await getProfilesFromCsv(await saveRequestFile(request));

      return await importProfiles({
        profiles,
        organizationId: withOrganizationId(request),
        logger: request.log,
        config,
        pool,
        source: isJson ? "json" : "csv",
      });
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

      return formatAPIResponse<ProfileWithDetails>({
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
      ensureUserCanAccessData(userData, profileId, organizationId);

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
      userData,
    }: FastifyRequestTypebox<typeof UpdateProfileSchema>) => {
      ensureUserCanAccessUser(userData, profileId);

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
      userData,
    }: FastifyRequestTypebox<typeof UpdateProfileSchema>) => {
      ensureUserCanAccessUser(userData, profileId);

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

  function ensureUserCanAccessData(
    userData: FastifyRequest["userData"],
    queryProfileId: string,
    queryOrganizationId: string | undefined,
  ): void {
    const loggedUserData = ensureUserCanAccessUser(userData, queryProfileId);
    // at this point we are already sure that the user requested
    // for a profileId that can be accessed
    // let's focus on organization check when needed

    // if queryOrganizationId is not provided it means that
    // it is trying to access its own data
    // or the data of the logged-in organization
    // if the user is not a ps, it can access any data for himself
    if (!queryOrganizationId || !loggedUserData.organizationId) {
      return;
    }

    // a ps can access data only for its own organization
    if (loggedUserData.organizationId !== queryOrganizationId) {
      throw httpErrors.forbidden(
        "You can't access this user's data for this organization",
      );
    }
  }
};

export default plugin;
export const autoPrefix = "/api/v1/profiles";

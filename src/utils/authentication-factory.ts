import { httpErrors } from "@fastify/sensible";
import {
  type BuildingBlocksSDK,
  type DefinedServices,
  type TokenFunction,
  getBuildingBlockSDK,
  getM2MTokenFn,
} from "@ogcio/building-blocks-sdk";
import type { FastifyBaseLogger } from "fastify";
import { trimSlash } from "./trim-slash.js";

type SetupSdks = DefinedServices<{
  services: {
    scheduler: {
      baseUrl: string;
    };
    profile: {
      baseUrl: string;
    };
    upload: {
      baseUrl: string;
    };
    analytics?: {
      baseUrl: string;
    };
  };
  getTokenFn: TokenFunction;
}>;

const profileBackendUrl = `${trimSlash(process.env.PROFILE_BACKEND_URL ?? "")}/`;
let analytics: BuildingBlocksSDK["analytics"] | undefined = undefined;
const sdkPerOrganisation: { [organizationId: string]: SetupSdks } = {};
let sdkPerCitizen: SetupSdks | undefined = undefined;

const getBaseProfileConfig = (): {
  logtoOidcEndpoint: string;
  applicationId: string;
  applicationSecret: string;
} => ({
  logtoOidcEndpoint: process.env.LOGTO_OIDC_ENDPOINT ?? "",
  applicationId: process.env.LOGTO_M2M_PROFILE_APP_ID ?? "",
  applicationSecret: process.env.LOGTO_M2M_PROFILE_APP_SECRET ?? "",
});

export const getProfileSdk = async (
  logger: FastifyBaseLogger,
  organizationId?: string,
): Promise<BuildingBlocksSDK["profile"]> => {
  return loadBuildingBlocksSdk(organizationId, logger).profile;
};

export const getSchedulerSdk = async (
  logger: FastifyBaseLogger,
  organizationId: string,
): Promise<BuildingBlocksSDK["scheduler"]> => {
  return loadBuildingBlocksSdk(organizationId, logger).scheduler;
};

const loadBuildingBlocksSdk = (
  organizationId?: string,
  logger?: FastifyBaseLogger,
): SetupSdks => {
  if (!organizationId) {
    if (!sdkPerCitizen) {
      sdkPerCitizen = getBuildingBlockSDK({
        services: {
          scheduler: {
            baseUrl: process.env.SCHEDULER_BACKEND_URL ?? "",
          },
          profile: {
            baseUrl: process.env.PROFILE_BACKEND_URL ?? "",
          },
          upload: {
            baseUrl: process.env.UPLOAD_BACKEND_URL ?? "",
          },
          analytics: {
            baseUrl: process.env.ANALYTICS_URL ?? "",
            matomoToken: process.env.ANALYTICS_MATOMO_TOKEN,
            trackingWebsiteId: process.env.ANALYTICS_WEBSITE_ID,
            dryRun: !!process.env.ANALYTICS_DRY_RUN,
          },
        },
        getTokenFn: getM2MTokenFn({
          services: {
            profile: {
              getAccessTokenParams: {
                resource: profileBackendUrl,
                scopes: ["profile:user.self:read"],
                ...getBaseProfileConfig(),
              },
            },
          },
        }),
        logger,
      });
    }
    return sdkPerCitizen;
  }

  if (!sdkPerOrganisation[organizationId]) {
    sdkPerOrganisation[organizationId] = getBuildingBlockSDK({
      services: {
        scheduler: {
          baseUrl: process.env.SCHEDULER_BACKEND_URL ?? "",
        },
        profile: {
          baseUrl: process.env.PROFILE_BACKEND_URL ?? "",
        },
        upload: {
          baseUrl: process.env.UPLOAD_BACKEND_URL ?? "",
        },
        analytics: {
          baseUrl: process.env.ANALYTICS_URL ?? "",
          matomoToken: process.env.ANALYTICS_MATOMO_TOKEN,
          trackingWebsiteId: process.env.ANALYTICS_WEBSITE_ID,
          dryRun: !!process.env.ANALYTICS_DRY_RUN,
        },
      },
      getTokenFn: getM2MTokenFn({
        services: {
          profile: {
            getOrganizationTokenParams: {
              scopes: ["profile:user:read"],
              organizationId,
              ...getBaseProfileConfig(),
            },
          },
          scheduler: {
            getOrganizationTokenParams: {
              logtoOidcEndpoint: process.env.LOGTO_OIDC_ENDPOINT ?? "",
              applicationId: process.env.LOGTO_M2M_SCHEDULER_APP_ID ?? "",
              applicationSecret:
                process.env.LOGTO_M2M_SCHEDULER_APP_SECRET ?? "",
              scopes: ["scheduler:jobs:write"],
              organizationId,
            },
          },
          upload: {
            getOrganizationTokenParams: {
              logtoOidcEndpoint: process.env.LOGTO_OIDC_ENDPOINT ?? "",
              applicationId: process.env.LOGTO_M2M_UPLOADER_APP_ID ?? "",
              applicationSecret:
                process.env.LOGTO_M2M_UPLOADER_APP_SECRET ?? "",
              scopes: ["upload:file:*"],
              organizationId,
            },
          },
          analytics: {
            getOrganizationTokenParams: {
              applicationId: process.env.LOGTO_M2M_ANALYTICS_APP_ID ?? "",
              applicationSecret:
                process.env.LOGTO_M2M_ANALYTICS_APP_SECRET ?? "",
              logtoOidcEndpoint: process.env.LOGTO_OIDC_ENDPOINT ?? "",
              organizationId,
              scopes: process.env.LOGTO_M2M_ANALYTICS_SCOPES
                ? process.env.LOGTO_M2M_ANALYTICS_SCOPES.split(",")
                : undefined,
            },
          },
        },
      }),
      logger,
    });
  }
  return sdkPerOrganisation[organizationId];
};

export const ensureUserIdIsSet = (request: {
  userData?: { userId?: string };
}): string => {
  if (request.userData?.userId) {
    return request.userData.userId;
  }

  throw httpErrors.forbidden("User id is not set");
};

export const ensureOrganizationIdIsSet = (request: {
  userData?: { organizationId?: string };
}): string => {
  if (request.userData?.organizationId) {
    return request.userData.organizationId;
  }

  throw httpErrors.forbidden("Organization id is not set");
};

export const getUploadSdk = async (
  logger: FastifyBaseLogger,
  organizationId: string,
): Promise<BuildingBlocksSDK["upload"]> => {
  return loadBuildingBlocksSdk(organizationId, logger).upload;
};

export const getAnalyticsSdk = async (
  logger: FastifyBaseLogger,
): Promise<BuildingBlocksSDK["analytics"]> => {
  if (analytics) return analytics;

  analytics = loadBuildingBlocksSdk(
    process.env.LOGTO_M2M_ANALYTICS_ORGANIZATION_ID,
    logger,
  ).analytics;
  return analytics;
};

import { httpErrors } from "@fastify/sensible";
import {
  type BuildingBlocksSDK,
  type DefinedServices,
  type TokenFunction,
  getBuildingBlockSDK,
  getM2MTokenFn,
} from "@ogcio/building-blocks-sdk";
import type { FastifyBaseLogger } from "fastify";
import type { EnvConfig } from "~/plugins/external/env.js";

type SetupSdks = DefinedServices<{
  services: {
    scheduler: {
      baseUrl: string;
    };
    analytics?: {
      baseUrl: string;
    };
  };
  getTokenFn: TokenFunction;
}>;

const sdkPerOrganisation: { [organizationId: string]: SetupSdks } = {};

export const getSchedulerSdk = async (
  logger: FastifyBaseLogger,
  organizationId: string,
  config: EnvConfig,
): Promise<BuildingBlocksSDK["scheduler"]> => {
  return loadBuildingBlocksSdk(config, organizationId, logger).scheduler;
};

export const getAnalyticsSdk = async (
  config: EnvConfig,
  logger: FastifyBaseLogger,
  organizationId: string,
): Promise<BuildingBlocksSDK["analytics"]> => {
  return loadBuildingBlocksSdk(config, organizationId, logger).analytics;
};

const loadBuildingBlocksSdk = (
  config: EnvConfig,
  organizationId?: string,
  logger?: FastifyBaseLogger,
): SetupSdks => {
  if (!organizationId) {
    throw httpErrors.internalServerError("No sdk for citizen are available");
  }

  if (!sdkPerOrganisation[organizationId]) {
    sdkPerOrganisation[organizationId] = getBuildingBlockSDK({
      services: {
        scheduler: {
          baseUrl: config.SCHEDULER_BACKEND_URL,
        },
        analytics: {
          baseUrl: config.ANALYTICS_URL ?? "",
          matomoToken: config.ANALYTICS_MATOMO_TOKEN,
          trackingWebsiteId: config.ANALYTICS_WEBSITE_ID,
          dryRun: config.ANALYTICS_DRY_RUN,
        },
      },
      getTokenFn: getM2MTokenFn({
        services: {
          scheduler: {
            getOrganizationTokenParams: {
              logtoOidcEndpoint: config.LOGTO_OIDC_ENDPOINT,
              applicationId: config.LOGTO_M2M_SCHEDULER_APP_ID,
              applicationSecret: config.LOGTO_M2M_SCHEDULER_APP_SECRET,
              scopes: ["scheduler:jobs:write"],
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

export const isOrganizationIdSet = (request: {
  userData?: { organizationId?: string };
}): boolean => {
  if (request.userData?.organizationId) {
    return true;
  }

  return false;
};

import { httpErrors } from "@fastify/sensible";
import type { FastifyBaseLogger } from "fastify";
import type { Pool } from "pg";
import { ImportStatus } from "~/const/index.js";
import {
  type AvailableLanguages,
  DEFAULT_LANGUAGE,
  type KnownProfileDataDetails,
} from "~/schemas/profiles/model.js";
import type { LogtoUserCreatedBody } from "~/schemas/webhooks/index.js";
import {
  createUpdateProfileDetails,
  updateProfile,
} from "~/services/profiles/index.js";
import {
  checkImportCompletion,
  createProfile,
  findProfileImportByJobId,
  findProfileImportDetailByEmail,
  getProfileImportDetailDataByEmail,
  updateProfileImportDetailsStatus,
  updateProfileImportStatusByJobId,
} from "~/services/profiles/sql/index.js";
import { withClient, withRollback } from "~/utils/index.js";
import { checkIfProfileExists } from "../profiles/sql/check-if-profile-exists-by-id.js";
import { type WebhookUser, webhookBodyToUser } from "./index.js";

interface WebhookResponse {
  id: string | undefined;
  error?: string;
  status: "success" | "error";
}

export const processUserCreatedOrUpdatedWebhook = async (params: {
  body: LogtoUserCreatedBody;
  pool: Pool;
  logger: FastifyBaseLogger;
}): Promise<WebhookResponse> => {
  const user = webhookBodyToUser(params.body.data);
  if (user.jobId) {
    return processUserForJob({ user, ...params });
  }

  return processUserForDirectSignin({ user, ...params });
};

async function processUserForJob(params: {
  user: WebhookUser;
  pool: Pool;
  logger: FastifyBaseLogger;
}): Promise<WebhookResponse> {
  const { user, pool, logger } = params;
  return withClient(pool, async (client) => {
    try {
      const jobId = user.jobId ?? null;

      if (!jobId) {
        return { id: user.id, status: "success" };
      }

      // First transaction: Create profile and update status
      const result = await withRollback(client, async () => {
        if (!user.organizationId) {
          throw httpErrors.badRequest("Organization ID is required");
        }

        const profileImportId = await findProfileImportByJobId(client, jobId);
        if (!profileImportId) {
          throw httpErrors.notFound(
            `No profile import found for job ID: ${jobId}`,
          );
        }

        const importDetail = await getProfileImportDetailDataByEmail(
          client,
          profileImportId,
          user.email,
        );

        const profileId = await createProfile(client, {
          id: user.id,
          email: user.email,
          publicName: [importDetail.firstName, importDetail.lastName].join(" "),
          primaryUserId: user.primaryUserId,
          safeLevel: 0,
        });

        await createUpdateProfileDetails(
          client,
          user.organizationId,
          profileId,
          importDetail,
        );

        const importDetailsId = await findProfileImportDetailByEmail(
          client,
          profileImportId,
          user.email,
        );

        await updateProfileImportDetailsStatus(
          client,
          [importDetailsId],
          ImportStatus.COMPLETED,
        );

        return { profileId, jobId };
      });

      // Second transaction: Check completion and update overall status
      await withRollback(client, async () => {
        logger.debug(`[Webhook] Checking completion for job ${result.jobId}`);
        const { isComplete, finalStatus } = await checkImportCompletion(
          client,
          result.jobId,
        );
        params.logger.debug("[Webhook] Completion check result:", {
          isComplete,
          finalStatus,
        });

        if (isComplete) {
          logger.debug(`[Webhook] Updating overall status to ${finalStatus}`);
          await updateProfileImportStatusByJobId(
            client,
            result.jobId,
            finalStatus,
          );
        } else {
          logger.debug(
            "[Webhook] Import not complete yet, staying in processing state",
          );
        }
      });

      return { id: result.profileId, status: "success" };
    } catch (error) {
      logger.error("[Webhook] Error processing webhook:", error);
      // If there's an error, mark the profile as failed but don't fail the entire import
      if (user.jobId) {
        // First transaction: Mark profile as failed
        await withRollback(client, async () => {
          logger.debug(`[Webhook] Marking profile ${user.email} as failed`);
          const profileImportId = await findProfileImportByJobId(
            client,
            user.jobId as string,
          );
          if (profileImportId) {
            const importDetailsId = await findProfileImportDetailByEmail(
              client,
              profileImportId,
              user.email,
            );
            await updateProfileImportDetailsStatus(
              client,
              [importDetailsId],
              ImportStatus.FAILED,
            );
          }
        });

        // Second transaction: Check completion and update overall status
        await withRollback(client, async () => {
          const { isComplete, finalStatus } = await checkImportCompletion(
            client,
            user.jobId as string,
          );

          if (isComplete) {
            params.logger.debug(
              `[Webhook] Updating overall status to ${finalStatus} after error`,
            );
            await updateProfileImportStatusByJobId(
              client,
              user.jobId as string,
              finalStatus,
            );
          }
        });
      }

      return {
        id: undefined,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
        status: "error",
      };
    }
  });
}

async function processUserForDirectSignin(params: {
  user: WebhookUser;
  pool: Pool;
  logger: FastifyBaseLogger;
}): Promise<WebhookResponse> {
  const { user, pool, logger } = params;
  return withClient(pool, async (client) => {
    try {
      // First transaction: Create profile and update status
      const result = await withRollback(client, async () => {
        let publicName = [
          user.details?.firstName ?? "",
          user.details?.lastName ?? "",
        ]
          .join(" ")
          .trim();

        if (publicName.length === 0) {
          publicName = user.email;
        }

        const importDetail: KnownProfileDataDetails = {
          email: user.email,
          firstName: user.details?.firstName ?? "N/D",
          lastName: user.details?.lastName ?? "N/D",
        };

        const profileData = {
          id: user.id,
          email: user.email,
          publicName,
          primaryUserId: user.primaryUserId,
          safeLevel: 0,
          preferredLanguage: DEFAULT_LANGUAGE as AvailableLanguages,
        };

        if (await checkIfProfileExists(client, user.id)) {
          await updateProfile({
            profileId: user.id,
            data: profileData,
            pool,
          });

          return { profileId: user.id };
        }
        await createProfile(client, profileData);

        await createUpdateProfileDetails(
          client,
          undefined,
          user.id,
          importDetail,
        );

        return { profileId: user.id };
      });

      return { id: result.profileId, status: "success" };
    } catch (error) {
      logger.error(
        "[Webhook] Error processing webhook for direct signin:",
        error,
      );
      return {
        id: undefined,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
        status: "error",
      };
    }
  });
}

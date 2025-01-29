import { httpErrors } from "@fastify/sensible";
import type { FastifyBaseLogger } from "fastify";
import type { Pool } from "pg";
import { ImportStatus } from "~/const/index.js";
import {
  DEFAULT_LANGUAGE,
  type KnownProfileDataDetails,
  type Profile,
} from "~/schemas/profiles/model.js";
import type { UpdateProfileBody } from "~/schemas/profiles/update.js";
import type { LogtoUserCreatedBody } from "~/schemas/webhooks/index.js";
import {
  createUpdateProfileDetails,
  updateProfile,
} from "~/services/profiles/index.js";
import {
  checkProfileImportCompletion,
  createProfile,
  findProfileImportDetailByEmail,
  getProfileImportDetailDataByEmail,
  updateProfileImportDetailsStatus,
  updateProfileImportStatus,
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
  if (user.profileImportId) {
    return processUserForProfileImport({ user, ...params });
  }

  return processUserForDirectSignin({ user, ...params });
};

async function processUserForProfileImport(params: {
  user: WebhookUser;
  pool: Pool;
  logger: FastifyBaseLogger;
}): Promise<WebhookResponse> {
  const { user, pool, logger } = params;
  const { profileImportId, email, organizationId, primaryUserId } = user;

  return withClient(pool, async (client) => {
    try {
      if (!profileImportId) {
        throw httpErrors.notFound(
          `No profile import found for profile import ID: ${profileImportId}`,
        );
      }

      // First transaction: Create profile and update status
      const { profileId } = await withRollback(client, async () => {
        if (!organizationId) {
          throw httpErrors.badRequest("Organization ID is required");
        }

        const importDetail = await getProfileImportDetailDataByEmail(
          client,
          profileImportId,
          email,
        );

        const profileId = await createProfile(client, {
          id: user.id,
          email,
          publicName: [importDetail.firstName, importDetail.lastName].join(" "),
          primaryUserId,
          safeLevel: 0,
        });

        await createUpdateProfileDetails(
          client,
          organizationId,
          profileId,
          importDetail,
        );

        const importDetailsId = await findProfileImportDetailByEmail(
          client,
          profileImportId,
          email,
        );

        await updateProfileImportDetailsStatus(
          client,
          [importDetailsId],
          ImportStatus.COMPLETED,
        );

        return { profileId };
      });

      // Second transaction: Check completion and update overall status
      await withRollback(client, async () => {
        logger.debug(
          `[Webhook] Checking completion for profile import ${profileImportId}`,
        );
        const { isComplete, finalStatus } = await checkProfileImportCompletion(
          client,
          profileImportId,
        );
        params.logger.debug("[Webhook] Completion check result:", {
          isComplete,
          finalStatus,
        });

        if (isComplete) {
          logger.debug(`[Webhook] Updating overall status to ${finalStatus}`);
          await updateProfileImportStatus(client, profileImportId, finalStatus);
        } else {
          logger.debug(
            "[Webhook] Import not complete yet, staying in processing state",
          );
        }
      });

      return { id: profileId, status: "success" };
    } catch (error) {
      logger.error("[Webhook] Error processing webhook:", error);
      // If there's an error, mark the profile as failed but don't fail the entire import
      if (profileImportId) {
        // First transaction: Mark profile as failed
        await withRollback(client, async () => {
          logger.debug(`[Webhook] Marking profile ${email} as failed`);
          if (profileImportId) {
            const importDetailsId = await findProfileImportDetailByEmail(
              client,
              profileImportId,
              email,
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
          const { isComplete, finalStatus } =
            await checkProfileImportCompletion(client, profileImportId);

          if (isComplete) {
            params.logger.debug(
              `[Webhook] Updating overall status to ${finalStatus} after error`,
            );
            await updateProfileImportStatus(
              client,
              profileImportId,
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
          phone: user.details?.phone,
          dateOfBirth: user.details?.dateOfBirth,
        };

        if (await checkIfProfileExists(client, user.id)) {
          const profileData: UpdateProfileBody = {
            preferredLanguage: DEFAULT_LANGUAGE,
            ...importDetail,
          };
          await updateProfile({
            profileId: user.id,
            data: profileData,
            pool,
          });

          return { profileId: user.id };
        }

        const profileDataToCreate: Profile = {
          id: user.id,
          primaryUserId: user.primaryUserId,
          safeLevel: 0,
          email: user.email,
          publicName: publicName,
        };
        await createProfile(client, profileDataToCreate);

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

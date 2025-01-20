import { httpErrors } from "@fastify/sensible";
import type { FastifyBaseLogger } from "fastify";
import type { Pool } from "pg";
import { ImportStatus } from "~/const/index.js";
import type { ImportProfilesBody } from "~/schemas/profiles/index.js";
import type { LogtoUserCreatedBody } from "~/schemas/webhooks/index.js";
import { createUpdateProfileDetails } from "~/services/profiles/index.js";
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
import { webhookBodyToUser } from "./index.js";

interface WebhookResponse {
  id: string | undefined;
  error?: string;
  status: "success" | "error";
}

export const processUserCreatedOrUpdatedWebhook = async (params: {
  body: LogtoUserCreatedBody;
  pool: Pool;
  logger: FastifyBaseLogger;
}): Promise<WebhookResponse> =>
  withClient(params.pool, async (client) => {
    const user = webhookBodyToUser(params.body.data);

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
          importDetail as ImportProfilesBody[0],
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
        params.logger.debug(
          `[Webhook] Checking completion for job ${result.jobId}`,
        );
        const { isComplete, finalStatus } = await checkImportCompletion(
          client,
          result.jobId,
        );
        params.logger.debug("[Webhook] Completion check result:", {
          isComplete,
          finalStatus,
        });

        if (isComplete) {
          params.logger.debug(
            `[Webhook] Updating overall status to ${finalStatus}`,
          );
          await updateProfileImportStatusByJobId(
            client,
            result.jobId,
            finalStatus,
          );
        } else {
          params.logger.debug(
            "[Webhook] Import not complete yet, staying in processing state",
          );
        }
      });

      return { id: result.profileId, status: "success" };
    } catch (error) {
      params.logger.error("[Webhook] Error processing webhook:", error);
      // If there's an error, mark the profile as failed but don't fail the entire import
      if (user.jobId) {
        // First transaction: Mark profile as failed
        await withRollback(client, async () => {
          params.logger.debug(
            `[Webhook] Marking profile ${user.email} as failed`,
          );
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

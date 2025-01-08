import { httpErrors } from "@fastify/sensible";
import type { FastifyBaseLogger } from "fastify";
import type { Pool, PoolClient } from "pg";
import { ImportStatus } from "~/const/profile.js";
import type { ImportProfilesBody } from "~/schemas/profiles/import.js";
import type { LogtoUserCreatedBody } from "~/schemas/webhooks/logto-user-created.js";
import { createUpdateProfileDetails } from "~/services/profile/create-update-profile-details.js";
import { checkImportCompletion } from "~/services/profile/sql/check-import-completion.js";
import {
  createProfile,
  findProfileImportByJobId,
  getProfileImportDetailDataByEmail,
  updateProfileImportDetailsStatus,
} from "~/services/profile/sql/index.js";
import { updateProfileImportStatusByJobId } from "~/services/profile/sql/update-profile-import-status-by-job-id.js";
import { withRollback } from "~/utils/with-rollback.js";
import { webhookBodyToUser } from "./webhook-body-to-user.js";

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
  let client: PoolClient | null = null;
  const user = webhookBodyToUser(params.body.data);
  try {
    const jobId = user.jobId ?? null;

    if (!jobId) {
      return { id: user.id, status: "success" };
    }

    client = await params.pool.connect();

    // First transaction: Create profile and update status
    const result = await withRollback(client, async (transactionClient) => {
      const profileImportId = await findProfileImportByJobId(
        transactionClient,
        jobId,
      );
      if (!profileImportId) {
        throw httpErrors.notFound(
          `No profile import found for job ID: ${jobId}`,
        );
      }

      const importDetail = await getProfileImportDetailDataByEmail(
        transactionClient,
        profileImportId,
        user.email,
      );

      if (!user.organizationId) {
        throw httpErrors.badRequest("Organization ID is required");
      }

      const profileId = await createProfile(transactionClient, {
        id: user.id,
        email: user.email,
        public_name: [importDetail.first_name, importDetail.last_name].join(
          " ",
        ),
        primary_user_id: user.primaryUserId,
        safe_level: 0,
      });

      await createUpdateProfileDetails(
        transactionClient,
        user.organizationId,
        profileId,
        importDetail as ImportProfilesBody[0],
      );

      const importDetailsId = await transactionClient
        .query<{ id: string }>(
          `SELECT id FROM profile_import_details 
           WHERE profile_import_id = $1 AND data->>'email' = $2`,
          [profileImportId, user.email],
        )
        .then((result) => result.rows[0]?.id);

      if (!importDetailsId) {
        throw httpErrors.notFound(
          `No import details found for email: ${user.email}`,
        );
      }

      await updateProfileImportDetailsStatus(
        transactionClient,
        [importDetailsId],
        ImportStatus.COMPLETED,
      );

      return { profileId, jobId };
    });

    // Second transaction: Check completion and update overall status
    await withRollback(client, async (transactionClient) => {
      params.logger.debug(
        `[Webhook] Checking completion for job ${result.jobId}`,
      );
      const { isComplete, finalStatus } = await checkImportCompletion(
        transactionClient,
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
          transactionClient,
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
    if (client && user.jobId) {
      // First transaction: Mark profile as failed
      await withRollback(client, async (transactionClient) => {
        params.logger.debug(
          `[Webhook] Marking profile ${user.email} as failed`,
        );
        const profileImportId = await findProfileImportByJobId(
          transactionClient,
          user.jobId as string,
        );
        if (profileImportId) {
          const importDetailsId = await transactionClient
            .query<{ id: string }>(
              `SELECT id FROM profile_import_details 
               WHERE profile_import_id = $1 AND data->>'email' = $2`,
              [profileImportId, user.email],
            )
            .then((result) => result.rows[0]?.id);

          if (importDetailsId) {
            await updateProfileImportDetailsStatus(
              transactionClient,
              [importDetailsId],
              ImportStatus.FAILED,
            );
          }
        }
      });

      // Second transaction: Check completion and update overall status
      await withRollback(client, async (transactionClient) => {
        const { isComplete, finalStatus } = await checkImportCompletion(
          transactionClient,
          user.jobId as string,
        );

        if (isComplete) {
          params.logger.debug(
            `[Webhook] Updating overall status to ${finalStatus} after error`,
          );
          await updateProfileImportStatusByJobId(
            transactionClient,
            user.jobId as string,
            finalStatus,
          );
        }
      });
    }

    return {
      id: undefined,
      error: error instanceof Error ? error.message : "Unknown error occurred",
      status: "error",
    };
  } finally {
    if (client) {
      await client.release();
    }
  }
};

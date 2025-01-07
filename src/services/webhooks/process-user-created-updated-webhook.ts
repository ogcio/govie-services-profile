import type { Pool, PoolClient } from "pg";
import type { ImportProfilesBody } from "~/schemas/profiles/import.js";
import type { LogtoUserCreatedBody } from "~/schemas/webhooks/logto-user-created.js";
import { createUpdateProfileDetails } from "~/services/profiles/create-update-profile-details.js";
import {
  createProfile,
  findProfileImportByJobId,
  getProfileImportDetailDataByEmail,
} from "~/services/profiles/sql/index.js";
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
}): Promise<WebhookResponse> => {
  let client: PoolClient | null = null;
  try {
    const user = webhookBodyToUser(params.body.data);
    const jobId = user.jobId ?? null;

    if (!jobId) {
      return { id: user.id, status: "success" };
    }

    client = await params.pool.connect();

    const result = await withRollback(client, async (transactionClient) => {
      const profileImportId = await findProfileImportByJobId(
        transactionClient,
        jobId,
      );
      if (!profileImportId) {
        throw new Error(`No profile import found for job ID: ${jobId}`);
      }

      const importDetail = await getProfileImportDetailDataByEmail(
        transactionClient,
        profileImportId,
        user.email,
      );

      if (!user.organizationId) {
        throw new Error("Organization ID is required");
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

      return profileId;
    });

    return { id: result, status: "success" };
  } catch (error) {
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

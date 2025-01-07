import type { Pool } from "pg";
import type { LogtoUserCreatedBody } from "~/schemas/webhooks/logto-user-created.js";
import { createUpdateProfileDetails } from "~/services/profiles/create-update-profile-details.js";
import {
  createProfile,
  findImportJob,
  getImportDataForUserEmail,
} from "~/services/profiles/sql/index.js";
import { withClient } from "~/utils/with-client.js";
import { withRollback } from "~/utils/with-rollback.js";
import { webhookBodyToUser } from "./webhook-body-to-user.js";

export const processUserCreatedOrUpdatedWebhook = async (params: {
  body: LogtoUserCreatedBody;
  pool: Pool;
}): Promise<{ id: string | undefined }> => {
  const client = await params.pool.connect();
  const user = webhookBodyToUser(params.body.data);
  const jobId = user.jobId ?? null;

  console.dir(user, { depth: null });

  // TODO: fix when coming from OIDC provider
  if (!jobId) return { id: user.id };

  try {
    const importedUserRow = await withClient(client, async (client) => {
      return await withRollback(client, async () => {
        const profileImportId = await findImportJob(client, jobId);

        return await getImportDataForUserEmail(
          client,
          profileImportId,
          user.email,
        );
      });
    });

    const profileId = await withClient(client, async (client) => {
      return await withRollback(client, async () => {
        return await createProfile(client, {
          id: user.id,
          email: user.email,
          public_name: [
            importedUserRow.first_name,
            importedUserRow.last_name,
          ].join(" "),
          primary_user_id: user.primaryUserId,
          safe_level: 0,
        });
      });
    });

    await createUpdateProfileDetails(
      client,
      user.organizationId ?? "",
      profileId,
      importedUserRow,
    );

    return { id: profileId };
  } catch (error) {
    // TODO: delete the user on logto if something fails on our side
    // mark the row as error
    // mark the import as failed
    console.error(error);
    return { id: undefined };
  } finally {
    // mark the row as success
    client.release();
  }
};

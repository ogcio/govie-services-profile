import type { Pool } from "pg";
import type { LogtoUserCreatedBody } from "~/schemas/webhooks/logto-user-created.js";
import {
  createProfile,
  createProfileDetails,
  findImportJob,
  getImportDataForUserEmail,
  updateProfileDetails,
} from "~/services/profiles/sql/index.js";
import { webhookBodyToUser } from "../webhook-body-to-user.js";

export const upsertUser = async (params: {
  body: LogtoUserCreatedBody;
  pool: Pool;
}): Promise<{ id: string }> => {
  const client = await params.pool.connect();
  const user = webhookBodyToUser(params.body.data);
  const jobId = user.jobId ?? null;

  // TODO: fix when coming from OIDC provider
  if (!jobId) return { id: user.id };

  // TODO: catch errors and delete the user on logto if something fails on our side
  try {
    const profileImportId = await findImportJob(client, jobId);

    const importedUserRow = await getImportDataForUserEmail(
      client,
      profileImportId,
      user.email,
    );

    const profileId = await createProfile(client, {
      id: user.id,
      email: user.email,
      public_name: [importedUserRow.first_name, importedUserRow.last_name].join(
        " ",
      ),
      primary_user_id: user.primary_user_id,
      safe_level: 0,
    });

    if (!profileId) {
      throw new Error(`Cannot upsert user with id ${user.id}`);
    }

    const toSetOrgId = user.organizationId ?? "";

    const profileDetailsId = await createProfileDetails(
      client,
      profileId,
      toSetOrgId,
    );
    // Create profile details data

    await updateProfileDetails(client, profileDetailsId, toSetOrgId, profileId);

    return { id: profileId };
  } finally {
    client.release();
  }
};

import type { FastifyInstance } from "fastify";
import type { LogtoError, LogtoErrorBody } from "~/clients/logto.js";
import { ImportStatus } from "~/const/profile.js";
import type { ImportProfilesBody } from "~/schemas/profiles/import.js";
import { withClient } from "~/utils/with-client.js";
import { withRollback } from "~/utils/with-rollback.js";
import { createLogtoUsers } from "./create-logto-users.js";
import { createUpdateProfileDetails } from "./create-update-profile-details.js";
import { lookupProfile } from "./lookup-profile.js";
import {
  createProfileImport,
  createProfileImportDetails,
  getProfileImportStatus,
  updateProfileImportDetails,
  updateProfileImportDetailsStatus,
} from "./sql/index.js";
import { updateProfileImportStatusByJobId } from "./sql/update-profile-import-status-by-job-id.js";

export const processClientImport = async (
  app: FastifyInstance,
  profiles: ImportProfilesBody,
  organizationId: string,
) => {
  const client = await app.pg.pool.connect();

  try {
    // 1. Create import job and import details
    app.log.info("About to create job for importing profiles");
    const { jobId, importDetailsIdList } = await withClient(
      client,
      async (client) => {
        return await withRollback(client, async () => {
          const jobId = await createProfileImport(client, organizationId);
          const importDetailsIdList = await createProfileImportDetails(
            client,
            jobId,
            profiles,
          );
          return { jobId, importDetailsIdList };
        });
      },
    );

    // 2. Try to process each profile
    app.log.info(`About to process ${profiles.length} profiles`);
    const profilesToCreate = await Promise.all(
      profiles.map(async (profile) => {
        const importDetailsId = importDetailsIdList[profiles.indexOf(profile)];
        try {
          // Mark the row status as processing
          await withClient(client, async (client) => {
            await updateProfileImportDetailsStatus(
              client,
              [importDetailsId],
              ImportStatus.PROCESSING,
            );
          });

          const { exists, profileId } = await lookupProfile(
            client,
            profile.email,
          );

          if (!exists) return profile;

          await createUpdateProfileDetails(
            client,
            organizationId,
            profileId as string,
            profile,
          );

          // Mark the row as completed
          await withClient(client, async (client) => {
            await updateProfileImportDetailsStatus(
              client,
              [importDetailsId],
              ImportStatus.COMPLETED,
            );
            await updateProfileImportStatusByJobId(
              client,
              jobId,
              ImportStatus.COMPLETED,
            );
          });
        } catch (err) {
          app.log.error(err);
          // mark the row with an error
          await withClient(client, async (client) => {
            await updateProfileImportDetails(
              client,
              [importDetailsId],
              (err as Error).message,
            );
            await updateProfileImportStatusByJobId(
              client,
              jobId,
              ImportStatus.FAILED,
            );
          });
        }
      }),
    );

    // 3. Create profiles in Logto
    if (profilesToCreate.length) {
      app.log.info(
        `About to create ${profilesToCreate.length} profiles on Logto`,
      );
      try {
        await createLogtoUsers(
          profilesToCreate,
          app.config,
          organizationId,
          jobId,
        );
      } catch (err) {
        app.log.error(err);
        // mark the whole import job with an unrecoverable error
        await withClient(client, async (client) => {
          await updateProfileImportDetails(
            client,
            importDetailsIdList,
            ((err as LogtoError).body as LogtoErrorBody).message,
            ImportStatus.UNRECOVERABLE,
          );
          await updateProfileImportStatusByJobId(
            client,
            jobId,
            ImportStatus.UNRECOVERABLE,
          );
        });
      }
    }

    return await withClient(client, async (client) => {
      return await getProfileImportStatus(client, jobId);
    });
  } finally {
    client.release();
  }
};

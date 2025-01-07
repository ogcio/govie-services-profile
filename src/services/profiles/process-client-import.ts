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
  // 1. Create import job and import details
  app.log.debug("About to create job for importing profiles");
  const { jobId, importDetailsMap } = await withClient(
    app.pg.pool,
    async (client) => {
      return withRollback(client, async () => {
        const jobId = await createProfileImport(client, organizationId);
        const importDetailsIdList = await createProfileImportDetails(
          client,
          jobId,
          profiles,
        );
        const importDetailsMap = new Map(
          profiles.map((profile, index) => [
            profile.email,
            importDetailsIdList[index],
          ]),
        );
        return { jobId, importDetailsMap };
      });
    },
  );

  // 2. Process profiles sequentially to maintain consistent state
  app.log.debug(`About to process ${profiles.length} profiles`);
  const profilesToCreate: ImportProfilesBody = [];

  for (const profile of profiles) {
    const importDetailsId = importDetailsMap.get(profile.email);
    if (!importDetailsId) {
      app.log.error(`No import details ID found for profile ${profile.email}`);
      continue;
    }

    try {
      await withClient(app.pg.pool, async (client) => {
        return withRollback(client, async () => {
          await updateProfileImportDetailsStatus(
            client,
            [importDetailsId],
            ImportStatus.PROCESSING,
          );

          const { exists, profileId } = await lookupProfile(
            client,
            profile.email,
          );

          if (!exists) {
            profilesToCreate.push(profile);
            await updateProfileImportDetailsStatus(
              client,
              [importDetailsId],
              ImportStatus.PENDING,
            );
            return;
          }

          await createUpdateProfileDetails(
            client,
            organizationId,
            profileId as string,
            profile,
          );

          await updateProfileImportDetailsStatus(
            client,
            [importDetailsId],
            ImportStatus.COMPLETED,
          );
        });
      });
    } catch (err) {
      app.log.error(`Error processing profile ${profile.email}:`, err);
      await withClient(app.pg.pool, async (client) => {
        return withRollback(client, async () => {
          await updateProfileImportDetails(
            client,
            [importDetailsId],
            err instanceof Error ? err.message : "Unknown error",
            ImportStatus.FAILED,
          );
        });
      });
    }
  }

  // 3. Create profiles in Logto and update final status
  let finalStatus = ImportStatus.COMPLETED;

  if (profilesToCreate.length) {
    app.log.debug(
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
      app.log.error("Error creating Logto users:", err);
      finalStatus = ImportStatus.UNRECOVERABLE;

      const errorMessage =
        err instanceof Error
          ? ((err as LogtoError).body as LogtoErrorBody)?.message || err.message
          : "Unknown error creating Logto users";

      await withClient(app.pg.pool, async (client) => {
        return withRollback(client, async () => {
          await updateProfileImportDetails(
            client,
            Array.from(importDetailsMap.values()),
            errorMessage,
            ImportStatus.UNRECOVERABLE,
          );
        });
      });
    }
  }

  // 4. Update final job status
  await withClient(app.pg.pool, async (client) => {
    return withRollback(client, async () => {
      await updateProfileImportStatusByJobId(client, jobId, finalStatus);
    });
  });

  // 5. Return final status
  return await withClient(app.pg.pool, async (client) => {
    return getProfileImportStatus(client, jobId);
  });
};

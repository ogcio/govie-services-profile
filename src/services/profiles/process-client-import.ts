import type { FastifyInstance } from "fastify";
import { ImportStatus } from "~/const/profile.js";
import type { ImportProfilesBody } from "~/schemas/profiles/import.js";
import { withClient } from "~/utils/with-client.js";
import { withRollback } from "~/utils/with-rollback.js";
import { createLogtoUsers } from "./create-logto-users.js";
import type { LogtoError } from "./create-logto-users.js";
import { createUpdateProfileDetails } from "./create-update-profile-details.js";
import { lookupProfile } from "./lookup-profile.js";
import {
  checkImportCompletion,
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
): Promise<string> => {
  // 1. Create import job and import details
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

  // 2. Process profiles
  const failedProfileIds = new Set<string>();
  const profilesToCreate: ImportProfilesBody = [];

  for (const profile of profiles) {
    const importDetailsId = importDetailsMap.get(profile.email) as string;
    app.log.debug(
      `Processing profile ${profile.email}... for importDetailsId ${importDetailsId}`,
    );

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
            // Mark as pending for Logto webhook to process
            await updateProfileImportDetailsStatus(
              client,
              [importDetailsId],
              ImportStatus.PENDING,
            );
          } else {
            // Update existing profile
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
          }
        });
      });
    } catch (err) {
      failedProfileIds.add(importDetailsId);
      app.log.error(
        `Failed to process profile ${profile.email} and importDetailsId ${importDetailsId}: ${err instanceof Error ? err.message : "Unknown error"}`,
      );
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

  // 3. Create Logto users for collected profiles that haven't failed
  if (profilesToCreate.length > 0) {
    try {
      const results = await createLogtoUsers(
        profilesToCreate,
        app.config,
        organizationId,
        jobId,
      );

      // Mark successful profiles as pending (for webhook)
      await withClient(app.pg.pool, async (client) => {
        return withRollback(client, async () => {
          const successfulEmails = results.map((r) => r.primaryEmail);
          const successfulIds = profilesToCreate
            .filter((p) => successfulEmails.includes(p.email))
            .map((p) => importDetailsMap.get(p.email))
            .filter((id): id is string => id !== undefined);

          await updateProfileImportDetailsStatus(
            client,
            successfulIds,
            ImportStatus.PENDING,
          );
        });
      });
    } catch (err) {
      // Update both failed and successful profiles in a single transaction
      await withClient(app.pg.pool, async (client) => {
        return withRollback(client, async () => {
          // Get successful and failed profiles
          const successfulEmails = (err as LogtoError)?.successfulEmails || [];
          const failedEmails = profilesToCreate
            .filter((p) => !successfulEmails.includes(p.email))
            .map((p) => importDetailsMap.get(p.email))
            .filter((id): id is string => id !== undefined);

          // Update failed profiles
          if (failedEmails.length > 0) {
            app.log.error(
              `Failed to create Logto users for profiles ${failedEmails.join(
                ", ",
              )}: ${err instanceof Error ? err.message : "Unknown error"}`,
            );
            await updateProfileImportDetails(
              client,
              failedEmails,
              err instanceof Error ? err.message : "Unknown error",
              ImportStatus.FAILED,
            );
            // Add these to failed profiles
            for (const id of failedEmails) {
              failedProfileIds.add(id);
            }
          }

          // Update successful profiles to COMPLETED
          const successfulIds = profilesToCreate
            .filter((p) => successfulEmails.includes(p.email))
            .map((p) => importDetailsMap.get(p.email))
            .filter((id): id is string => id !== undefined);

          if (successfulIds.length > 0) {
            await updateProfileImportDetailsStatus(
              client,
              successfulIds,
              ImportStatus.COMPLETED,
            );
          }
        });
      });
      await withClient(app.pg.pool, async (client) => {
        withRollback(client, async () => {
          // Check completion and update overall status
          app.log.debug(
            `[Process-Import] Checking completion after error for job ${jobId}`,
          );
          const { isComplete, finalStatus } = await checkImportCompletion(
            client,
            jobId,
          );

          app.log.debug("[Process-Import] Completion check result:", {
            isComplete,
            finalStatus,
          });

          if (isComplete) {
            app.log.debug(
              `[Process-Import] Updating overall status to ${finalStatus} after error`,
            );
            await updateProfileImportStatusByJobId(client, jobId, finalStatus);
          } else {
            app.log.debug(
              `[Process-Import] Import is not complete yet. Current status: ${finalStatus}`,
            );
          }
        });
      });
    }
  }

  // 4. Return current status
  return await withClient(app.pg.pool, async (client) => {
    return getProfileImportStatus(client, jobId);
  });
};

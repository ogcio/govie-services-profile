import type { FastifyBaseLogger } from "fastify";
import type { Pool } from "pg";
import { ImportStatus } from "~/const/profile.js";
import type { EnvConfig } from "~/plugins/external/env.js";
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

export const processClientImport = async (params: {
  pool: Pool;
  logger: FastifyBaseLogger;
  profiles: ImportProfilesBody;
  organizationId: string;
  config: EnvConfig;
}): Promise<string> => {
  const { config, pool, logger, profiles, organizationId } = params;

  // 1. Create import job and import details
  const { jobId, importDetailsMap } = await withClient(pool, async (client) => {
    return withRollback(client, async () => {
      console.log("Creating profile import job...");
      const jobId = await createProfileImport(client, organizationId);
      console.log("Created profile import job:", jobId);
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
      console.log("Created profile import details:", importDetailsMap);
      return { jobId, importDetailsMap };
    });
  });

  // 2. Process profiles
  const failedProfileIds = new Set<string>();
  const profilesToCreate: ImportProfilesBody = [];
  for (const profile of profiles) {
    const importDetailsId = importDetailsMap.get(profile.email) as string;
    logger.debug(
      `Processing profile ${profile.email}... for importDetailsId ${importDetailsId}`,
    );

    try {
      await withClient(pool, async (client) => {
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
      logger.error(
        `Failed to process profile ${profile.email} and importDetailsId ${importDetailsId}: ${err instanceof Error ? err.message : "Unknown error"}`,
      );
      await withClient(pool, async (client) => {
        return updateProfileImportDetails(
          client,
          [importDetailsId],
          err instanceof Error ? err.message : "Unknown error",
          ImportStatus.FAILED,
        );
      });
    }
  }

  // 3. Create Logto users for collected profiles that haven't failed
  if (profilesToCreate.length > 0) {
    try {
      const results = await createLogtoUsers(
        profilesToCreate,
        config,
        organizationId,
        jobId,
      );

      // Mark successful profiles as pending (for webhook)
      await withClient(pool, async (client) => {
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
    } catch (err) {
      // Update both failed and successful profiles in a single transaction
      await withClient(pool, async (client) => {
        return withRollback(client, async () => {
          // Get successful and failed profiles
          const successfulEmails = (err as LogtoError)?.successfulEmails || [];
          const failedEmails = profilesToCreate
            .filter((p) => !successfulEmails.includes(p.email))
            .map((p) => importDetailsMap.get(p.email))
            .filter((id): id is string => id !== undefined);

          // Update failed profiles
          if (failedEmails.length > 0) {
            logger.error(
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
      await withClient(pool, async (client) => {
        withRollback(client, async () => {
          // Check completion and update overall status
          logger.debug(
            `[Process-Import] Checking completion after error for job ${jobId}`,
          );
          const { isComplete, finalStatus } = await checkImportCompletion(
            client,
            jobId,
          );

          logger.debug("[Process-Import] Completion check result:", {
            isComplete,
            finalStatus,
          });

          if (isComplete) {
            logger.debug(
              `[Process-Import] Updating overall status to ${finalStatus} after error`,
            );
            await updateProfileImportStatusByJobId(client, jobId, finalStatus);
          } else {
            logger.debug(
              `[Process-Import] Import is not complete yet. Current status: ${finalStatus}`,
            );
          }
        });
      });
    }
  } else {
    // Set the status to completed if there are no profiles to create
    await withClient(pool, async (client) => {
      return updateProfileImportStatusByJobId(
        client,
        jobId,
        ImportStatus.COMPLETED,
      );
    });
  }

  // 4. Return current status
  return await withClient(pool, async (client) => {
    return getProfileImportStatus(client, jobId);
  });
};

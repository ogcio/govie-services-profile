import type { FastifyBaseLogger } from "fastify";
import type { Pool } from "pg";
import { ImportStatus } from "~/const/index.js";
import type { EnvConfig } from "~/plugins/external/env.js";
import type { KnownProfileDataDetails } from "~/schemas/profiles/index.js";
import { withClient, withRollback } from "~/utils/index.js";
import {
  type LogtoError,
  createLogtoUsers,
  createUpdateProfileDetails,
} from "./index.js";
import {
  checkImportCompletion,
  createProfileImport,
  createProfileImportDetails,
  getProfileImportStatus,
  lookupProfile,
  updateProfileImportDetails,
  updateProfileImportDetailsStatus,
  updateProfileImportStatusByJobId,
} from "./sql/index.js";

export const importProfiles = async (params: {
  pool: Pool;
  logger: FastifyBaseLogger;
  profiles: KnownProfileDataDetails[];
  organizationId: string;
  config: EnvConfig;
}): Promise<{ status: ImportStatus; jobId: string }> =>
  withClient(params.pool, async (client) => {
    const { config, logger, profiles, organizationId } = params;

    // 1. Create import job and import details
    const { jobId, importDetailsMap } = await withRollback(client, async () => {
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

    // 2. Process profiles
    const failedProfileIds = new Set<string>();
    const profilesToCreate: KnownProfileDataDetails[] = [];
    for (const profile of profiles) {
      const importDetailsId = importDetailsMap.get(profile.email) as string;
      logger.debug(
        `Processing profile ${profile.email}... for importDetailsId ${importDetailsId}`,
      );

      try {
        await withRollback(client, async () => {
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
      } catch (err) {
        failedProfileIds.add(importDetailsId);
        logger.error(
          `Failed to process profile ${profile.email} and importDetailsId ${importDetailsId}: ${err instanceof Error ? err.message : "Unknown error"}`,
        );
        await updateProfileImportDetails(
          client,
          [importDetailsId],
          err instanceof Error ? err.message : "Unknown error",
          ImportStatus.FAILED,
        );
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
      } catch (err) {
        // Update both failed and successful profiles in a single transaction
        await withRollback(client, async () => {
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

        await withRollback(client, async () => {
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
      }
    } else {
      // Set the status to completed if there are no profiles to create
      await updateProfileImportStatusByJobId(
        client,
        jobId,
        ImportStatus.COMPLETED,
      );
    }

    // 4. Return current status
    return {
      status: await getProfileImportStatus(client, jobId),
      jobId,
    };
  });

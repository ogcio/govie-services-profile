import type { FastifyBaseLogger } from "fastify";
import type { Pool } from "pg";
import { ImportStatus } from "~/const/index.js";
import type { EnvConfig } from "~/plugins/external/env.js";
import type { KnownProfileDataDetails } from "~/schemas/profiles/index.js";
import { getSchedulerSdk, withClient, withRollback } from "~/utils/index.js";
import type { SavedFileInfo } from "~/utils/save-request-file.js";
import {
  type LogtoError,
  createLogtoUsers,
  createUpdateProfileDetails,
  getProfilesFromCsv,
} from "./index.js";
import { getProfileImport } from "./sql/get-profile-import.js";
import {
  checkProfileImportCompletion,
  createProfileImport,
  createProfileImportDetails,
  getProfileImportStatus,
  lookupProfile,
  updateProfileImportDetails,
  updateProfileImportDetailsStatus,
  updateProfileImportStatus,
} from "./sql/index.js";

export const scheduleImportProfiles = async (params: {
  pool: Pool;
  logger: FastifyBaseLogger;
  organizationId: string;
  config: EnvConfig;
  source?: "json" | "csv";
  fileMetadata?: SavedFileInfo["metadata"];
  immediate?: boolean;
}): Promise<{ status: ImportStatus; profileImportId: string }> =>
  withClient(params.pool, async (client) => {
    const { organizationId, source, fileMetadata } = params;

    const { profileImportId } = await withRollback(client, async () => {
      const { jobToken, profileImportId } = await createProfileImport(
        client,
        organizationId,
        source,
        fileMetadata,
      );
      if (params.immediate) {
        return { profileImportId };
      }

      const schedulerSdk = await getSchedulerSdk(
        params.logger,
        organizationId,
        params.config,
      );
      // 1 minute from now
      // TODO: Make this back-off depending on the number of imports currently running
      const scheduleDate = new Date(Date.now() + 60 * 1000);
      await schedulerSdk.scheduleTasks([
        {
          executeAt: scheduleDate.toISOString(),
          webhookUrl: `${params.config.HOST_URL}/api/v1/jobs/${profileImportId}`,
          webhookAuth: jobToken,
        },
      ]);
      return { profileImportId };
    });

    return { status: ImportStatus.PENDING, profileImportId };
  });

export const executeImportProfiles = async (params: {
  pool: Pool;
  logger: FastifyBaseLogger;
  profileImportId: string;
  config: EnvConfig;
  profiles?: KnownProfileDataDetails[];
}): Promise<{ status: ImportStatus; profileImportId: string }> =>
  withClient(params.pool, async (client) =>
    withRollback(client, async () => {
      const { organisationId, metadata } = await getProfileImport(
        client,
        params.profileImportId,
      );
      const profiles =
        params.profiles ?? (await getProfilesFromCsv(metadata.filepath));

      return await importProfiles({
        pool: params.pool,
        logger: params.logger,
        profiles,
        organizationId: organisationId,
        config: params.config,
        profileImportId: params.profileImportId,
      });
    }),
  );

export const importProfiles = async (params: {
  pool: Pool;
  logger: FastifyBaseLogger;
  profiles: KnownProfileDataDetails[];
  organizationId: string;
  config: EnvConfig;
  profileImportId: string;
}): Promise<{ status: ImportStatus; profileImportId: string }> =>
  withClient(params.pool, async (client) => {
    const { config, logger, profiles, organizationId, profileImportId } =
      params;

    // 1. Create import job and import details
    const { importDetailsMap } = await withRollback(client, async () => {
      const importDetailsIdList = await createProfileImportDetails(
        client,
        profileImportId,
        profiles,
      );
      const importDetailsMap = new Map(
        profiles.map((profile, index) => [
          profile.email,
          importDetailsIdList[index],
        ]),
      );
      return { importDetailsMap };
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
          profileImportId,
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
            `[Process-Import] Checking completion after error for profile import ${profileImportId}`,
          );
          const { isComplete, finalStatus } =
            await checkProfileImportCompletion(client, profileImportId);

          logger.debug("[Process-Import] Completion check result:", {
            isComplete,
            finalStatus,
          });

          if (isComplete) {
            logger.debug(
              `[Process-Import] Updating overall status to ${finalStatus} after error`,
            );
            await updateProfileImportStatus(
              client,
              profileImportId,
              finalStatus,
            );
          } else {
            logger.debug(
              `[Process-Import] Import is not complete yet. Current status: ${finalStatus}`,
            );
          }
        });
      }
    } else {
      // Set the status to completed if there are no profiles to create
      await updateProfileImportStatus(
        client,
        profileImportId,
        ImportStatus.COMPLETED,
      );
    }

    // 4. Return current status
    return {
      status: await getProfileImportStatus(client, profileImportId),
      profileImportId,
    };
  });

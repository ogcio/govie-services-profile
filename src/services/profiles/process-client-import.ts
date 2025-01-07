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
    console.log(
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
      console.error(
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
      // Mark only the failed profiles
      await withClient(app.pg.pool, async (client) => {
        return withRollback(client, async () => {
          const failedEmails = profilesToCreate
            .filter(
              (p) => !(err as LogtoError)?.successfulEmails?.includes(p.email),
            )
            .map((p) => importDetailsMap.get(p.email))
            .filter((id): id is string => id !== undefined);

          if (failedEmails.length > 0) {
            console.error(
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
        });
      });
    }
  }

  // 4. Update final job status based on whether all profiles failed or not
  const finalStatus =
    failedProfileIds.size === profiles.length
      ? ImportStatus.FAILED
      : ImportStatus.PROCESSING;

  await withClient(app.pg.pool, async (client) => {
    return withRollback(client, async () => {
      await updateProfileImportStatusByJobId(client, jobId, finalStatus);
    });
  });

  // 5. Return current status
  return await withClient(app.pg.pool, async (client) => {
    return getProfileImportStatus(client, jobId);
  });
};

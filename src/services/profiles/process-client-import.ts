import type { FastifyInstance } from "fastify";
import type { LogtoError, LogtoErrorBody } from "~/clients/logto.js";
import type { ImportProfilesBody } from "~/schemas/profiles/import.js";
import { withClient } from "~/utils/with-client.js";
import { withRollback } from "~/utils/with-rollback.js";
import { createLogtoUsers } from "./create-logto-users.js";
import { createProfileDetails } from "./sql/create-profile-details.js";
import { findExistingProfile } from "./sql/find-existing-profile.js";
import {
  createImportDetails,
  createImportJob,
  markImportRowError,
  markImportRowStatus,
} from "./sql/index.js";
import { markImportStatus } from "./sql/mark-import-status.js";
import { updateProfileDetails } from "./sql/update-profile-details.js";

// TODO:
// - mark profile import status
// - check user permissions
// - check logto integration
// - create logto webhook
// - use enums not strings
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
          const jobId = await createImportJob(client, organizationId);
          const importDetailsIdList = await createImportDetails(
            client,
            jobId,
            profiles,
          );
          return { jobId, importDetailsIdList };
        });
      },
      "Failed to create job for importing profiles",
    );

    // 2. Try to process each profile
    app.log.info(`About to process ${profiles.length} profiles`);
    const profilesToCreate = await Promise.all(
      profiles.map(async (profile) => {
        const importDetailsId = importDetailsIdList[profiles.indexOf(profile)];
        try {
          // Mark the row status as processing
          await withClient(
            client,
            async (client) => {
              await markImportRowStatus(
                client,
                [importDetailsId],
                "processing",
              );
            },
            "Failed to mark import row processing",
          );

          const existingProfileId = await withClient(
            client,
            async (client) => {
              return await findExistingProfile(client, profile.email);
            },
            "Failed to find existing profile",
          );

          if (!existingProfileId) return profile;

          await withClient(
            client,
            async (client) => {
              await withRollback(client, async () => {
                const profileDetailId = await createProfileDetails(
                  client,
                  existingProfileId,
                  organizationId,
                  profile,
                );

                await updateProfileDetails(
                  client,
                  profileDetailId,
                  organizationId,
                  existingProfileId,
                );
              });
            },
            "Failed to create and update profile details",
          );

          // Mark the row as completed
          await withClient(
            client,
            async (client) => {
              await markImportRowStatus(client, [importDetailsId], "completed");
              await markImportStatus(client, jobId, "completed");
            },
            "Failed to mark import row completed",
          );
        } catch (err) {
          // mark the row with an error
          await withClient(
            client,
            async (client) => {
              await markImportRowError(
                client,
                [importDetailsId],
                (err as Error).message,
              );
            },
            "Failed to mark import row error",
          );
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
        // mark the whole import job with an unrecoverable error
        await withClient(
          client,
          async (client) => {
            await markImportRowError(
              client,
              importDetailsIdList,
              ((err as LogtoError).body as LogtoErrorBody).message,
              "unrecoverable",
            );
            await markImportStatus(client, jobId, "unrecoverable");
          },
          "Failed to mark unrecoverable import error",
        );
      }
    }
  } finally {
    client.release();
  }
};

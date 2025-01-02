import type { FastifyInstance } from "fastify";
import type { PoolClient } from "pg";
import type { ImportProfilesBody } from "~/schemas/profiles/import.js";
import { withClient } from "~/utils/with-client.js";
import { withRollback } from "~/utils/with-rollback.js";
import { createUsersOnLogto } from "./interact-logto.js";
import { createProfileDetails } from "./sql/create-profile-details.js";
import { findExistingProfile } from "./sql/find-existing-profile.js";
import {
  createImportDetails,
  createImportJob,
  markImportRowError,
  markImportRowStatus,
} from "./sql/index.js";
import { updateProfileDetails } from "./sql/update-profile-details.js";

// TODO:
// - mark profile import status
// - check user permissions
// - check logto integration
// - create logto webhook
// - use enums not strings
const processClientImport = async (
  app: FastifyInstance,
  profiles: ImportProfilesBody,
  organizationId: string,
) => {
  const newProfiles: Pick<
    ImportProfilesBody[0],
    "email" | "first_name" | "last_name"
  >[] = [];

  const client = await app.pg.pool.connect();

  try {
    // Bail out early if a job cannot be created
    const { jobId, importDetailsIdList } = await withClient(
      client,
      async (client) => {
        return await createImportJobAndDetails(
          client,
          organizationId,
          profiles,
        );
      },
      "Failed to import profiles",
    );

    // Try to process each profile
    for (const profile of profiles) {
      const importDetailsId = importDetailsIdList[profiles.indexOf(profile)];

      try {
        // TODO: add proper logging
        console.log("PROCESSING PROFILE: ", profile);

        // Mark the row status as processing
        await withClient(
          client,
          async (client) => {
            await markImportRowStatus(client, [importDetailsId], "processing");
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

        if (!existingProfileId) {
          // TODO: add proper logging
          console.log("PROFILE DOES NOT EXIST");

          const { first_name, last_name, email } = profile;
          newProfiles.push({ first_name, last_name, email });
          continue;
        }

        // TODO: add proper logging
        console.log("PROFILE EXISTS");

        await withClient(
          client,
          async (client) => {
            await createAndUpdateProfileDetails(
              client,
              existingProfileId,
              organizationId,
              profile,
            );
          },
          "Failed to create and update profile details",
        );

        // Mark the row as completed
        await withClient(
          client,
          async (client) => {
            await markImportRowStatus(client, [importDetailsId], "completed");
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
    }

    if (newProfiles.length) {
      try {
        // TODO: add proper logging
        console.log("INVOKING LOGTO");

        await createUsersOnLogto(
          newProfiles,
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
              (err as Error).message,
              "unrecoverable",
            );
          },
          "Failed to mark unrecoverable import error",
        );
      }
    }
  } finally {
    client.release();
  }
};

const createImportJobAndDetails = async (
  client: PoolClient,
  organizationId: string,
  profiles: ImportProfilesBody,
) => {
  return await withRollback(client, async () => {
    const jobId = await createImportJob(client, organizationId);
    const importDetailsIdList = await createImportDetails(
      client,
      jobId,
      profiles,
    );
    return { jobId, importDetailsIdList };
  });
};

const createAndUpdateProfileDetails = async (
  client: PoolClient,
  profileId: string,
  organizationId: string,
  details: ImportProfilesBody[0],
) => {
  await withRollback(client, async () => {
    const profileDetailId = await createProfileDetails(
      client,
      profileId,
      organizationId,
      details,
    );

    await updateProfileDetails(
      client,
      profileDetailId,
      organizationId,
      profileId,
    );
  });
};

export { processClientImport };

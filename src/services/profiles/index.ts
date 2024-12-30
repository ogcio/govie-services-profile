import { isNativeError } from "node:util/types";
import type { FastifyInstance } from "fastify";
import type { PoolClient } from "pg";
import type { ImportProfiles } from "~/types/profile.js";
import { createImportDetails, createImportJob } from "./importer.js";
import { createUsersOnLogto } from "./interact-logto.js";

const processProfilesImport = async (
  app: FastifyInstance,
  profiles: ImportProfiles,
  organizationId: string,
) => {
  const newProfiles: Pick<
    ImportProfiles[0],
    "email" | "first_name" | "last_name"
  >[] = [];

  const client = await app.pg.pool.connect();

  try {
    client.query("BEGIN");

    const jobId = await createImportJob(client, organizationId);
    await createImportDetails(client, jobId, profiles);

    client.query("COMMIT");

    for (const profile of profiles) {
      // TODO: add proper logging
      console.log("PROCESSING PROFILE: ", profile);

      const existingProfileId = await findExistingProfile(
        client,
        profile.email,
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

      client.query("BEGIN");

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

      client.query("COMMIT");
    }

    if (newProfiles.length) {
      // TODO: add proper logging
      console.log("INVOKING LOGTO");

      await createUsersOnLogto(newProfiles, app, organizationId, jobId);
    }
  } catch (err) {
    client.query("ROLLBACK");

    throw new Error(
      isNativeError(err) ? err.message : "Failed to import profiles",
    );
  } finally {
    client.release();
  }
};

const findExistingProfile = async (client: PoolClient, email: string) => {
  const query = "SELECT id FROM profiles WHERE email = $1;";
  const values = [email];

  const result = await client.query<{ id: string }>(query, values);
  return result.rows[0]?.id;
};

const createProfileDetails = async (
  client: PoolClient,
  profileId: string,
  organizationId: string,
  details: ImportProfiles[0],
) => {
  const query = `INSERT INTO profile_details(
        profile_id,
        organisation_id,
        details,
        is_latest
    ) VALUES ($1, $2, $3, $4) RETURNING id;`;

  const values = [profileId, organizationId, details, true];

  const result = await client.query<{ id: string }>(query, values);
  return result.rows[0]?.id;
};

const updateProfileDetails = async (
  client: PoolClient,
  profileDetailId: string,
  organizationId: string,
  profileId: string,
) => {
  const query =
    "UPDATE profile_details SET is_latest = false WHERE id <> $1 AND organisation_id = $2 AND profile_id = $3;";

  const values = [profileDetailId, organizationId, profileId];

  await client.query(query, values);
};

export { processProfilesImport };

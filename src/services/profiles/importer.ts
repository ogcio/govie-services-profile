import crypto from "node:crypto";
import type { PostgresDb } from "@fastify/postgres";
import type { Pool, PoolClient } from "pg";
import type { ImportProfiles } from "~/types/profile.js";

type Database = (PostgresDb & Record<string, PostgresDb>) | Pool;

const createImportJob = async (client: PoolClient, organisationId: string) => {
  const jobId = crypto.randomBytes(16).toString("hex");
  await client.query<{ id: string }>(
    "INSERT INTO profile_imports (job_id, organisation_id) VALUES ($1, $2) RETURNING id;",
    [jobId, organisationId],
  );

  return jobId;
};

const findImportJob = async (client: PoolClient, jobId: string) => {
  const result = await client.query<{ id: string }>(
    "SELECT id FROM profile_imports WHERE job_id = $1;",
    [jobId],
  );

  return result.rows[0]?.id;
};

const createImportDetails = async (
  client: PoolClient,
  jobId: string,
  profiles: ImportProfiles,
) => {
  const values = profiles.map((_, index) => `($1, $${index + 2})`).join(",");

  const profileImportId = await findImportJob(client, jobId);

  const params = [profileImportId];
  for (const profile of profiles) {
    params.push(JSON.stringify(profile));
  }

  const queryDetails = `
    INSERT INTO profile_import_details (
      profile_import_id,  
      data
    ) VALUES ${values}
  `;

  await client.query(queryDetails, params);
};

const getImportData = async (
  pg: Database,
  organisationId: string,
  jobId: string,
) => {
  const result = await pg.query<{ position: number; profile: string }>(
    `
SELECT arr.position, arr.item_object as profile
FROM profile_imports,
jsonb_array_elements(data) with ordinality arr(item_object, position) 
WHERE organisation_id = $1 AND job_id = $2;`,
    [organisationId, jobId],
  );

  return result.rows.map((row) => row.profile);
};

const getImportDataForUserEmail = async (
  pg: Database,
  organisationId: string,
  jobId: string,
  email: string,
) => {
  const result = await pg.query<{ profile: ImportProfiles[0] }>(
    `
SELECT arr.item_object as profile
FROM profile_imports,
jsonb_array_elements(data) with ordinality arr(item_object, position) 
WHERE organisation_id = $1 AND job_id = $2 AND item_object->>'email' = $3 LIMIT 1;`,
    [organisationId, jobId, email],
  );

  return result.rows[0].profile;
};

export {
  createImportJob,
  getImportData,
  getImportDataForUserEmail,
  createImportDetails,
  findImportJob,
};

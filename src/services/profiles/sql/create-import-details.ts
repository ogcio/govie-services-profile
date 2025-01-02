import type { PoolClient } from "pg";
import type { ImportProfilesBody } from "~/schemas/profiles/import.js";
import { findImportJob } from "./find-import-job.js";

export const createImportDetails = async (
  client: PoolClient,
  jobId: string,
  profiles: ImportProfilesBody,
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
     RETURNING id;
  `;

  const result = await client.query<{ id: string }>(queryDetails, params);
  return result.rows.map((row) => row.id);
};

import type { PoolClient } from "pg";
import type { ImportProfilesBody } from "~/schemas/profiles/import.js";
import { findProfileImportByJobId } from "./find-profile-import-by-job-id.js";

export const createProfileImportDetails = async (
  client: PoolClient,
  jobId: string,
  profiles: ImportProfilesBody,
): Promise<string[]> => {
  const values = profiles.map((_, index) => `($1, $${index + 2})`).join(",");

  const profileImportId = await findProfileImportByJobId(client, jobId);

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

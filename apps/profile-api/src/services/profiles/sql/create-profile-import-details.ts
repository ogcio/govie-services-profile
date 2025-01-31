import type { PoolClient } from "pg";
import type { KnownProfileDataDetails } from "~/schemas/profiles/index.js";

export const createProfileImportDetails = async (
  client: PoolClient,
  profileImportId: string,
  profiles: KnownProfileDataDetails[],
): Promise<string[]> => {
  const values = profiles.map((_, index) => `($1, $${index + 2})`).join(",");

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

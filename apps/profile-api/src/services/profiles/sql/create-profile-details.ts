import type { PoolClient } from "pg";
import { ProfileDetailsError } from "../create-update-profile-details.js";

export const createProfileDetails = async (
  client: PoolClient,
  profileId: string,
  organizationId: string | undefined,
): Promise<string> => {
  const query = `INSERT INTO profile_details(
        profile_id,
        organisation_id,
        is_latest
    ) VALUES ($1, $2, $3) RETURNING id;`;

  const values = [profileId, organizationId, true];

  const result = await client.query<{ id: string }>(query, values);

  if (!result.rows[0]?.id) {
    throw new ProfileDetailsError(
      `Unable to insert profile detail with profile_id ${profileId} and organisation id ${organizationId}`,
    );
  }

  return result.rows[0].id;
};

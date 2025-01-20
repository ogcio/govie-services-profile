import type { PoolClient } from "pg";
import type { ProfileWithDetailsFromDb } from "~/schemas/profiles/index.js";

export const findProfileWithData = async (
  client: PoolClient,
  organizationId: string | undefined,
  profileId: string,
): Promise<ProfileWithDetailsFromDb | undefined> => {
  const result = await client.query<ProfileWithDetailsFromDb>(
    `
        SELECT 
        p.id,
        p.public_name as "publicName",
        p.email,
        p.primary_user_id as "primaryUserId",
        p.created_at as "createdAt",
        p.updated_at as "updatedAt",
        p.preferred_language as "preferredLanguage",
        (
            SELECT jsonb_object_agg(pdata.name, 
            jsonb_build_object(
                'value', pdata.value,
                'type', pdata.value_type
            )
            )
            FROM profile_data pdata
            INNER JOIN profile_details pd ON pd.id = pdata.profile_details_id
            WHERE pd.profile_id = p.id 
            AND pd.organisation_id = $1
            AND pd.is_latest = true
        ) as details
        FROM profiles p
        WHERE p.id = $2
        AND p.deleted_at IS NULL
        `,
    [organizationId, profileId],
  );

  return result.rows?.[0];
};

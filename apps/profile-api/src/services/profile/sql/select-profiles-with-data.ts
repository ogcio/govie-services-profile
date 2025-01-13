import type { Pool } from "pg";
import type { ProfilesIndexResponse } from "~/schemas/profiles/index.js";
import { withClient } from "~/utils/with-client.js";

export const selectProfilesWithData = (
  pool: Pool,
  organizationId: string,
  profileIds: string[],
) =>
  withClient(pool, async (client) => {
    const result = await client.query<ProfilesIndexResponse>(
      `
        SELECT 
          p.id,
          p.public_name,
          p.email,
          p.primary_user_id,
          p.created_at,
          p.updated_at,
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
        WHERE p.id = ANY($2)
        AND p.deleted_at IS NULL
        ORDER BY p.created_at DESC
        `,
      [organizationId, profileIds],
    );

    return result.rows;
  });

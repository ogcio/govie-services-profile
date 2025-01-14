import type { Pool } from "pg";
import type { ProfileWithData } from "~/schemas/profiles/index.js";
import { withClient } from "~/utils/index.js";

export const findProfile = async (params: {
  pool: Pool;
  organizationId: string;
  query: Record<string, string>;
}): Promise<ProfileWithData> =>
  withClient(params.pool, async (client) => {
    const { email, firstName, lastName, phone } = params.query;

    // Build dynamic WHERE clauses based on provided search params
    const conditions = [];
    const values = [params.organizationId];
    let paramIndex = 2;

    if (email) {
      conditions.push(`(p.email ILIKE $${paramIndex} OR EXISTS (
            SELECT 1 FROM profile_data pd
            WHERE pd.profile_details_id = pdet.id
            AND pd.name = 'email'
            AND pd.value_type = 'string'
            AND pd.value ILIKE $${paramIndex}
          ))`);
      values.push(`%${email}%`);
      paramIndex++;
    }

    if (firstName) {
      conditions.push(`EXISTS (
            SELECT 1 FROM profile_data pd
            WHERE pd.profile_details_id = pdet.id
            AND pd.name = 'first_name'
            AND pd.value_type = 'string'
            AND pd.value ILIKE $${paramIndex}
          )`);
      values.push(`%${firstName}%`);
      paramIndex++;
    }

    if (lastName) {
      conditions.push(`EXISTS (
            SELECT 1 FROM profile_data pd
            WHERE pd.profile_details_id = pdet.id
            AND pd.name = 'last_name'
            AND pd.value_type = 'string'
            AND pd.value ILIKE $${paramIndex}
          )`);
      values.push(`%${lastName}%`);
      paramIndex++;
    }

    if (phone) {
      conditions.push(`EXISTS (
            SELECT 1 FROM profile_data pd
            WHERE pd.profile_details_id = pdet.id
            AND pd.name = 'phone'
            AND pd.value_type = 'string'
            AND pd.value ILIKE $${paramIndex}
          )`);
      values.push(`%${phone}%`);
      paramIndex++;
    }

    const whereClause = conditions.length
      ? `AND (${conditions.join(" AND ")})`
      : "";

    // Query using indexes for performance
    const { rows } = await client.query<ProfileWithData>(
      `
          SELECT DISTINCT
            p.id,
            p.public_name,
            p.email,
            p.primary_user_id,
            p.safe_level,
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
              WHERE pdata.profile_details_id = pdet.id
            ) as details
          FROM profiles p
          INNER JOIN profile_details pdet 
            ON pdet.profile_id = p.id 
            AND pdet.organisation_id = $1
            AND pdet.is_latest = true
          WHERE p.deleted_at IS NULL
          ${whereClause}
          ORDER BY p.created_at DESC
          LIMIT 1
        `,
      values,
    );

    return rows[0];
  });

import type { PoolClient } from "pg";

export interface ProfileLookupResult {
  exists: boolean;
  profileId: string | undefined;
  profileDetailId: string | undefined;
}

export const lookupProfile = async (
  client: PoolClient,
  email: string,
): Promise<ProfileLookupResult> => {
  // We have these indexes to use:
  // - idx_profiles_email ON profiles(email)
  // - idx_profile_data_lookup ON profile_data(value, value_type, name) WHERE value_type = 'string' AND name = 'email'
  // - idx_profile_details_latest ON profile_details(profile_id) WHERE is_latest = true
  const result = await client.query<{
    profile_id: string;
    profile_detail_id: string;
  }>(
    `
    WITH found_profile AS (
      -- First try direct email lookup (uses idx_profiles_email)
      SELECT id, created_at
      FROM profiles
      WHERE email = $1 AND deleted_at IS NULL
      UNION ALL
      -- Then try profile_data lookup (uses idx_profile_data_lookup)
      SELECT p.id, p.created_at
      FROM profile_data pd
      JOIN profile_details pdet ON pdet.id = pd.profile_details_id
      JOIN profiles p ON p.id = pdet.profile_id
      WHERE pd.value = $1 
      AND pd.value_type = 'string' 
      AND pd.name = 'email'
      AND p.deleted_at IS NULL
      AND p.email <> $1
    )
    SELECT 
      fp.id as profile_id,
      pd.id as profile_detail_id
    FROM found_profile fp
    -- Use the index for latest profile details (idx_profile_details_latest)
    LEFT JOIN profile_details pd ON pd.profile_id = fp.id AND pd.is_latest = true
    ORDER BY fp.created_at DESC
    LIMIT 1;
    `,
    [email.toLowerCase()],
  );

  const row = result.rows[0];
  return {
    exists: Boolean(row?.profile_id),
    profileId: row?.profile_id,
    profileDetailId: row?.profile_detail_id,
  };
};

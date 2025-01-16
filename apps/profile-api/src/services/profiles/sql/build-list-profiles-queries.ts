export const buildListProfilesQueries = (params: {
  organisationId: string;
  pagination: { limit: string; offset: string };
  search?: string;
  activeOnly?: boolean;
}): {
  count: { query: string; values: (string | number)[] };
  data: { query: string; values: (string | number)[] };
} => {
  const whereHelper = prepareWhereClauses(params);
  let nextIndexInQuery = whereHelper.nextIndexInQuery;

  const baseQuery = `
    FROM profiles p
    INNER JOIN profile_details pd ON pd.profile_id = p.id
    INNER JOIN profile_data pdata ON pdata.profile_details_id = pd.id
    WHERE pd.organisation_id = $1
    AND pd.is_latest = true
    ${params.activeOnly ? "AND p.deleted_at IS NULL" : ""}
    ${whereHelper.whereClauses}
  `;

  return {
    count: {
      query: `SELECT COUNT(DISTINCT p.id) as count ${baseQuery}`,
      values: whereHelper.queryValues,
    },
    data: {
      query: `
        SELECT DISTINCT
          p.id,
          p.public_name,
          p.email,
          p.primary_user_id,
          p.created_at,
          p.updated_at,
        ${baseQuery}
        ORDER BY p.created_at DESC
        LIMIT $${nextIndexInQuery++} OFFSET $${nextIndexInQuery}
      `,
      values: [
        ...whereHelper.queryValues,
        params.pagination.limit,
        params.pagination.offset,
      ],
    },
  };
};

const prepareWhereClauses = (params: {
  organisationId: string;
  search?: string;
}): {
  whereClauses: string;
  queryValues: (string | number)[];
  nextIndexInQuery: number;
} => {
  let nextIndexInQuery = 2;
  const whereClauses = [];
  const queryValues = [params.organisationId];
  const search = params.search ? params.search.trim() : "";

  if (search.length > 0) {
    whereClauses.push(
      `(
        p.email ILIKE $2 OR
        p.public_name ILIKE $2
      )`,
      // Old query, at the moment we just need to search in email and public name, not in details
      // `(
      //   p.email ILIKE $2 OR
      //   p.public_name ILIKE $2 OR
      //   EXISTS (
      //     SELECT 1 FROM profile_data pd
      //     WHERE pd.profile_details_id = pd.id
      //     AND pd.value_type = 'string'
      //     AND pd.value ILIKE $2
      //   )
      // )`,
    );
    queryValues.push(`%${search}%`);
    nextIndexInQuery++;
  }

  const whereClause = whereClauses.length
    ? ` AND ${whereClauses.join(" AND ")} `
    : "";

  return {
    whereClauses: whereClause,
    queryValues,
    nextIndexInQuery,
  };
};

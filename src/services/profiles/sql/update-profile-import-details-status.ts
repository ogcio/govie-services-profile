import type { PoolClient } from "pg";

export const updateProfileImportDetailsStatus = async (
  client: PoolClient,
  importDetailsIdList: string[],
  status: string,
) => {
  const placeholders = importDetailsIdList
    .map((_, index) => `$${index + 2}`)
    .join(",");

  await client.query(
    `UPDATE profile_import_details SET status = $1 WHERE id IN (${placeholders});`,
    [status, ...importDetailsIdList],
  );
};

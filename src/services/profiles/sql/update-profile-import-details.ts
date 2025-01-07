import type { PoolClient } from "pg";

export const updateProfileImportDetails = async (
  client: PoolClient,
  importDetailsIdList: string[],
  error: string,
  status = "failed",
) => {
  const placeholders = importDetailsIdList
    .map((_, index) => `$${index + 3}`)
    .join(",");

  await client.query(
    `UPDATE profile_import_details SET error_message = $1, status = $2 WHERE id IN (${placeholders});`,
    [error, status, ...importDetailsIdList],
  );
};

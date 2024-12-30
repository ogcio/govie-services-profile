import type { PoolClient } from "pg";

export const withRollback = async <T>(
  client: PoolClient,
  callback: () => Promise<T>,
): Promise<T> => {
  try {
    await client.query("BEGIN");
    const result = await callback();
    await client.query("COMMIT");
    return result;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  }
};

import type { Pool, PoolClient } from "pg";
import { isNativeError } from "util/types";

export const withClient = async <T>(
  pool: Pool,
  callback: (client: PoolClient) => Promise<T>,
  errorMessage = "Database operation failed",
): Promise<T> => {
  const client = await pool.connect();
  try {
    return await callback(client);
  } catch (err) {
    throw new Error(isNativeError(err) ? err.message : errorMessage);
  } finally {
    client.release();
  }
};

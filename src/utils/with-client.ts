import type { PoolClient } from "pg";
import { isNativeError } from "util/types";

export const withClient = async <T>(
  client: PoolClient,
  callback: (client: PoolClient) => Promise<T>,
  errorMessage = "Database operation failed",
): Promise<T> => {
  try {
    return await callback(client);
  } catch (err) {
    throw new Error(isNativeError(err) ? err.message : errorMessage);
  } finally {
    client.release();
  }
};

import { release } from "os";
import type { Client } from "pg";

interface ExecutedQuery {
  sql: string;
  values?: (string | Date)[] | undefined;
  response: { rowCount: number; rows: Record<string, unknown>[] };
}

export const buildMockPg = (
  preparedResponses: (Record<string, unknown>[] | (() => void))[],
) => {
  let currentIndex = 0;
  const executedQueries: ExecutedQuery[] = [];
  let inTransaction = false;

  const queryFn = async (
    sql: string,
    values?: (string | Date)[] | undefined,
  ) => {
    if (currentIndex >= preparedResponses.length) {
      throw new Error(
        `Requesting more queries than prepared responses: ${sql}`,
      );
    }

    const response = preparedResponses[currentIndex];
    currentIndex++;

    if (sql.includes("BEGIN")) {
      inTransaction = true;
    } else if (sql.includes("COMMIT") || sql.includes("ROLLBACK")) {
      inTransaction = false;
    }

    executedQueries.push({
      sql,
      values,
      response: { rows: [], rowCount: 0 },
    });

    if (typeof response === "function") {
      try {
        response();
      } catch (error) {
        inTransaction = false; // Reset transaction state on error
        throw error;
      }
    }

    const result = {
      rows: response as Record<string, unknown>[],
      rowCount: Array.isArray(response) ? response.length : 0,
    };
    return result;
  };

  const pg = {
    query: queryFn,
    getExecutedQueries: () => executedQueries,
    release: () => release,
    get in_transaction() {
      return inTransaction;
    },
  };

  return pg as unknown as Client & {
    getExecutedQueries: () => ExecutedQuery[];
    release: () => void;
    in_transaction: boolean;
  };
};

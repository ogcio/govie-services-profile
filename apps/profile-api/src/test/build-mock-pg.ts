import { release } from "os";
import type { Client } from "pg";

interface ExecutedQuery {
  sql: string;
  values?: (string | Date)[] | undefined;
  response: { rowCount: number; rows: Record<string, unknown>[] };
}

export const buildMockPg = (preparedResponses: Record<string, unknown>[][]) => {
  let currentIndex = 0;
  const executedQueries: ExecutedQuery[] = [];
  const queryFn = (sql: string, values?: (string | Date)[] | undefined) => {
    if (currentIndex >= preparedResponses.length) {
      throw new Error(
        `Requesting more queries than prepared responses: ${sql}`,
      );
    }
    const response = {
      rows: preparedResponses[currentIndex],
      rowCount: preparedResponses[currentIndex].length,
    };
    executedQueries.push({ sql, values, response });
    currentIndex++;
    return response;
  };
  const pg = {
    query: queryFn,
    getExecutedQueries: () => executedQueries,
    release: () => release,
  };

  return pg as unknown as Client & {
    getExecutedQueries: () => ExecutedQuery[];
    release: () => void;
  };
};

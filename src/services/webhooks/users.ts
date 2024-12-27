import { httpErrors } from "@fastify/sensible";
import type { Pool } from "pg";

export const processUserWebhook = async (params: {
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  body: any;
  pool: Pool;
}): Promise<{ id: string } | undefined> => {
  switch (params.body.event) {
    case "User.Data.Updated":
    case "User.Created":
      throw httpErrors.notImplemented(
        `This event, ${params.body.event}, is not managed yet`,
      );
    default:
      return undefined;
  }
};

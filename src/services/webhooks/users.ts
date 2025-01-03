import { httpErrors } from "@fastify/sensible";
import type { Pool } from "pg";
import type { LogtoWebhookBody } from "~/schemas/webhooks/logto.js";

export const processUserWebhook = async (params: {
  body: LogtoWebhookBody;
  pool: Pool;
}): Promise<{ id: string } | undefined> => {
  console.dir(params.body, { depth: null });
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

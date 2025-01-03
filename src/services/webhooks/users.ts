import { httpErrors } from "@fastify/sensible";
import type { Pool } from "pg";
import type { LogtoUserCreatedBody } from "~/schemas/webhooks/logto-user-created.js";
import { upsertUser } from "./sql/upsert-user.js";

export const processUserWebhook = async (params: {
  body: LogtoUserCreatedBody;
  pool: Pool;
}): Promise<{ id: string } | undefined> => {
  switch (params.body.event) {
    case "User.Data.Updated":
    case "User.Created":
      return upsertUser({ ...params });
    default:
      throw httpErrors.notImplemented(
        `This event, ${params.body.event}, is not managed yet`,
      );
  }
};

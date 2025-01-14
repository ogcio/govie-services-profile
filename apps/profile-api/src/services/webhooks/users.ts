import { httpErrors } from "@fastify/sensible";
import type { FastifyBaseLogger } from "fastify";
import type { Pool } from "pg";
import type { LogtoUserCreatedBody } from "~/schemas/webhooks/index.js";
import { processUserCreatedOrUpdatedWebhook } from "./index.js";

export const processUserWebhook = async (params: {
  body: LogtoUserCreatedBody;
  pool: Pool;
  logger: FastifyBaseLogger;
}): Promise<{ id: string | undefined }> => {
  switch (params.body.event) {
    case "User.Data.Updated":
    case "User.Created":
      return processUserCreatedOrUpdatedWebhook({ ...params });
    default:
      throw httpErrors.notImplemented(
        `This event, ${params.body.event}, is not managed yet`,
      );
  }
};

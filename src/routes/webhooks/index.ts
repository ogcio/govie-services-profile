import type { FastifyPluginAsyncTypebox } from "@fastify/type-provider-typebox";
import type { FastifyInstance } from "fastify";
import type { FastifyRequestTypebox } from "~/schemas/shared.js";
import type { LogtoWebhookSchema } from "~/schemas/webhooks/logto.js";
import { processUserWebhook } from "~/services/webhooks/users.js";
import { verifySignature } from "~/utils/verify-signature.js";

const plugin: FastifyPluginAsyncTypebox = async (fastify: FastifyInstance) => {
  fastify.post(
    "/user-login-wh",
    {
      config: {
        rawBody: true,
      },
    },
    async (request: FastifyRequestTypebox<typeof LogtoWebhookSchema>) => {
      const isSignatureVerified = verifySignature(
        fastify.config.LOGTO_WEBHOOK_SIGNING_KEY,
        request.rawBody as Buffer,
        request.headers["logto-signature-sha-256"] as string,
      );
      if (!isSignatureVerified) throw new Error("Signature not verified...");
      await processUserWebhook({ body: request.body, pool: fastify.pg.pool });
    },
  );
};

export default plugin;
export const autoPrefix = "";

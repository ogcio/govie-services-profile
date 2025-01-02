import type { FastifyPluginAsyncTypebox } from "@fastify/type-provider-typebox";
import type { FastifyInstance } from "fastify";
import { processUserWebhook } from "~/services/webhooks/users.js";
import { verifySignatureOrThrow } from "~/utils/verify-signature.js";

const plugin: FastifyPluginAsyncTypebox = async (fastify: FastifyInstance) => {
  fastify.post(
    "/user-login-wh",
    {
      preValidation: (req) =>
        verifySignatureOrThrow({
          key: fastify.config.LOGTO_WEBHOOK_SIGNING_KEY,
          body: req.body as Buffer,
          signature: req.headers["logto-signature-sha-256"] as string,
        }),
      config: {
        rawBody: true,
      },
    },
    async (req) => {
      await processUserWebhook({ body: req.body, pool: fastify.pg.pool });

      return { status: "ok" };
    },
  );
};

export default plugin;
export const autoPrefix = "/api/v1";

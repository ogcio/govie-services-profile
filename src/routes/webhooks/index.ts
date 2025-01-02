import type { FastifyPluginAsyncTypebox } from "@fastify/type-provider-typebox";
import type { FastifyInstance } from "fastify";
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
    async (req) => {
      const isSignatureVerified = verifySignature(
        fastify.config.LOGTO_WEBHOOK_SIGNING_KEY,
        req.rawBody as Buffer,
        req.headers["logto-signature-sha-256"] as string,
      );
      if (!isSignatureVerified) throw new Error("Signature not verified...");

      // biome-ignore lint/suspicious/noExplicitAny: <explanation>
      const body = req.body as any;

      await processUserWebhook({ body, pool: fastify.pg.pool });

      return { status: "ok" };
    },
  );
};

export default plugin;
export const autoPrefix = "/api/v1";

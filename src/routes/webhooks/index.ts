import { createHmac } from "node:crypto";
import type { FastifyInstance } from "fastify";
import { processUserWebhook } from "~/services/webhooks/users.js";

// https://docs.logto.io/docs/recipes/webhooks/securing-your-webhooks/
export const verifySignature = (
  signingKey: string,
  rawBody: Buffer,
  expectedSignature: string,
) => {
  const hmac = createHmac("sha256", signingKey);
  hmac.update(rawBody);
  const signature = hmac.digest("hex");
  return signature === expectedSignature;
};

export default async function webhooks(app: FastifyInstance) {
  app.post(
    "/user-login-wh",
    {
      config: {
        rawBody: true,
      },
    },
    async (req) => {
      const isSignatureVerified = verifySignature(
        app.config.LOGTO_WEBHOOK_SIGNING_KEY,
        req.rawBody as Buffer,
        req.headers["logto-signature-sha-256"] as string,
      );
      if (!isSignatureVerified) throw new Error("Signature not verified...");

      // biome-ignore lint/suspicious/noExplicitAny: <explanation>
      const body = req.body as any;

      await processUserWebhook({ body, pool: app.pg.pool });

      return { status: "ok" };
    },
  );
}

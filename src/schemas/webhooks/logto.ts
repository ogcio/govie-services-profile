import { type Static, Type } from "@sinclair/typebox";

export const WEBHOOKS_TAG = "webhooks";

export const LogtoWebhookSchema = {
  tags: [WEBHOOKS_TAG],
  body: Type.Object({
    hookId: Type.String(),
    event: Type.String(),
    createdAt: Type.String({ format: "date-time" }),
    sessionId: Type.String(),
    userAgent: Type.String(),
    ip: Type.String(),
    path: Type.String(),
    method: Type.String(),
    status: Type.Number(),
    params: Type.Object({
      id: Type.String(),
    }),
    data: Type.Object({
      result: Type.String(),
    }),
  }),
};

export type LogtoWebhookBody = Static<typeof LogtoWebhookSchema.body>;

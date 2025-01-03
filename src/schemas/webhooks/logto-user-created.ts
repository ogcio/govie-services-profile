import { type Static, Type } from "@sinclair/typebox";
import { WEBHOOKS_TAG } from "./logto-shared.js";

export const LogtoUserCreatedSchema = {
  tags: [WEBHOOKS_TAG],
  body: Type.Object({
    hookId: Type.String(),
    event: Type.String(),
    sessionId: Type.String(),
    userAgent: Type.String(),
    ip: Type.String(),
    path: Type.String(),
    method: Type.String(),
    status: Type.Number(),
    createdAt: Type.String({ format: "date-time" }),
    data: Type.Object({
      id: Type.String(),
      username: Type.String(),
      primaryEmail: Type.String({ format: "email" }),
      primaryPhone: Type.Union([Type.String(), Type.Null()]),
      name: Type.String(),
      avatar: Type.Union([Type.String(), Type.Null()]),
      customData: Type.Object({
        jobId: Type.String(),
        organizationId: Type.String(),
      }),
      identities: Type.Record(
        Type.String(),
        Type.Object({
          details: Type.Object({
            email: Type.String(),
            rawData: Type.Record(Type.String(), Type.String()),
          }),
        }),
      ),
      lastSignInAt: Type.Union([Type.Number(), Type.Null()]),
      createdAt: Type.Number(),
      updatedAt: Type.Number(),
      profile: Type.Record(Type.String(), Type.Unknown()),
      applicationId: Type.Union([Type.String(), Type.Null()]),
      isSuspended: Type.Boolean(),
      hasPassword: Type.Boolean(),
    }),
  }),
};

export type LogtoUserCreatedBody = Static<typeof LogtoUserCreatedSchema.body>;

import { type Static, Type } from "@sinclair/typebox";
import { WEBHOOKS_TAG } from "./logto-shared.js";

const NullableString = Type.Union([Type.String(), Type.Null()]);

export const LogtoUserCreatedSchema = {
  tags: [WEBHOOKS_TAG],
  operationId: "logtoUserCreated",
  body: Type.Object({
    hookId: Type.Optional(NullableString),
    event: Type.Optional(NullableString),
    sessionId: Type.Optional(NullableString),
    userAgent: Type.Optional(NullableString),
    ip: Type.Optional(NullableString),
    path: Type.Optional(NullableString),
    method: Type.Optional(NullableString),
    status: Type.Optional(Type.Number()),
    createdAt: Type.Optional(Type.String({ format: "date-time" })),
    data: Type.Object({
      id: Type.String(),
      username: NullableString,
      primaryEmail: Type.String({ format: "email" }),
      primaryPhone: Type.Optional(NullableString),
      name: Type.Optional(NullableString),
      avatar: Type.Optional(NullableString),
      customData: Type.Object({
        jobId: Type.Optional(NullableString),
        organizationId: Type.Optional(NullableString),
      }),
      identities: Type.Record(
        Type.String(),
        Type.Object({
          details: Type.Object({
            email: Type.Optional(NullableString),
            rawData: Type.Record(
              Type.String(),
              Type.Union([
                Type.String(),
                Type.Null(),
                Type.Number(),
                Type.Boolean(),
              ]),
            ),
          }),
        }),
      ),
      lastSignInAt: Type.Optional(Type.Union([Type.Number(), Type.Null()])),
      createdAt: Type.Optional(Type.Number()),
      updatedAt: Type.Optional(Type.Number()),
      profile: Type.Optional(Type.Record(Type.String(), Type.Unknown())),
      applicationId: Type.Optional(NullableString),
      isSuspended: Type.Optional(Type.Boolean()),
      hasPassword: Type.Optional(Type.Boolean()),
    }),
  }),
};

export type LogtoUserCreatedBody = Static<typeof LogtoUserCreatedSchema.body>;

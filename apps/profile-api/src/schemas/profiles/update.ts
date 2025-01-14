import { type Static, Type } from "@sinclair/typebox";
import { PROFILES_TAG } from "./shared.js";

export const UpdateProfileSchema = {
  tags: [PROFILES_TAG],
  operationId: "updateProfile",
  params: Type.Object({
    profileId: Type.String({
      description: "ID of the profile to update",
    }),
  }),
  querystring: Type.Object({
    organizationId: Type.String({
      description: "Organization ID owning the profile",
    }),
  }),
  body: Type.Object(
    {
      public_name: Type.Optional(Type.String()),
      email: Type.Optional(Type.String({ format: "email" })),
      phone: Type.Optional(Type.String()),
      address: Type.Optional(Type.String()),
      city: Type.Optional(Type.String()),
      first_name: Type.Optional(Type.String()),
      last_name: Type.Optional(Type.String()),
      date_of_birth: Type.Optional(Type.String({ format: "date" })),
    },
    { additionalProperties: false },
  ),
};

export type UpdateProfileParams = Static<typeof UpdateProfileSchema.params>;
export type UpdateProfileBody = Static<typeof UpdateProfileSchema.body>;

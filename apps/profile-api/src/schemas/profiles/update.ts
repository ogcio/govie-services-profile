import { type Static, Type } from "@sinclair/typebox";
import { HttpError } from "~/types/index.js";
import { getGenericResponseSchema } from "~/utils/index.js";
import { AvailableLanguagesSchema, ProfileWithDetailsSchema } from "./index.js";
import { PROFILES_TAG } from "./shared.js";

export const UpdateProfileSchema = {
  tags: [PROFILES_TAG],
  params: Type.Object({
    profileId: Type.String({
      description: "ID of the profile to update",
    }),
  }),
  querystring: Type.Object({
    organizationId: Type.Optional(
      Type.String({
        description: "Organization ID owning the profile",
      }),
    ),
  }),
  body: Type.Object(
    {
      publicName: Type.Optional(Type.String()),
      email: Type.Optional(Type.String({ format: "email" })),
      phone: Type.Optional(Type.String()),
      address: Type.Optional(Type.String()),
      city: Type.Optional(Type.String()),
      firstName: Type.Optional(Type.String()),
      lastName: Type.Optional(Type.String()),
      dateOfBirth: Type.Optional(Type.String({ format: "date" })),
      preferredLanguage: Type.Optional(AvailableLanguagesSchema),
    },
    { additionalProperties: false },
  ),
  response: {
    200: getGenericResponseSchema(ProfileWithDetailsSchema),
    "4xx": HttpError,
    "5xx": HttpError,
  },
};

export type UpdateProfileBody = Static<typeof UpdateProfileSchema.body>;

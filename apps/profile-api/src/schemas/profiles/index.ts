import { type Static, Type } from "@sinclair/typebox";
import { NullableStringType } from "~/types/typebox.js";
import { PaginationParamsSchema } from "../pagination.js";
import { PROFILES_TAG } from "./shared.js";

export const ProfilesIndexSchema = {
  tags: [PROFILES_TAG],
  operationId: "indexProfiles",
  querystring: Type.Composite([
    Type.Object({
      search: Type.Optional(
        Type.String({
          description:
            "If set, the endpoint searches for users whom contain this value in either the public name or the email address",
        }),
      ),
    }),
    PaginationParamsSchema,
  ]),
};

export type ProfilesIndexQueryParams = Static<
  typeof ProfilesIndexSchema.querystring
>;

export const ProfileDetailsSchema = Type.Object({
  city: NullableStringType(),
  email: NullableStringType(),
  address: NullableStringType(),
  phone: NullableStringType(),
  first_name: NullableStringType(),
  last_name: NullableStringType(),
  date_of_birth: NullableStringType(),
});

export type ProfileDetails = Static<typeof ProfileDetailsSchema>;

export const ProfilesIndexResponseSchema = Type.Composite([
  Type.Object({
    id: Type.String(),
    public_name: Type.String(),
    email: Type.String(),
    primary_user_id: Type.String(),
    created_at: Type.String({ format: "date-time" }),
    updated_at: Type.String({ format: "date-time" }),
    details: ProfileDetailsSchema,
  }),
]);

export type ProfilesIndexResponse = Static<typeof ProfilesIndexResponseSchema>;

export const GetProfileSchema = {
  tags: [PROFILES_TAG],
  operationId: "getProfile",
  params: Type.Object({
    profileId: Type.String({
      description: "ID of the profile to retrieve",
    }),
  }),
  querystring: Type.Object({
    organizationId: Type.Optional(Type.String()),
  }),
};

export type GetProfileParams = Static<typeof GetProfileSchema.params>;

export const SelectProfilesSchema = {
  tags: [PROFILES_TAG],
  operationId: "selectProfiles",
  querystring: Type.Object({
    ids: Type.String({
      description: "Comma-separated list of profile IDs",
      pattern: "^[a-zA-Z0-9-]+(,[a-zA-Z0-9-]+)*$",
    }),
  }),
};

export type SelectProfilesQueryParams = Static<
  typeof SelectProfilesSchema.querystring
>;

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

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
  publicIdentityId: NullableStringType({
    description: "PPSN of the imported user",
  }),
  firstName: NullableStringType({
    description: "First name of the imported user",
  }),
  lastName: NullableStringType({
    description: "Last name of the imported user",
  }),
  birthDate: NullableStringType({
    description: "Birth date of the imported user",
  }),
  address: Type.Union(
    [
      Type.Object({
        city: NullableStringType(),
        zipCode: NullableStringType(),
        street: NullableStringType(),
        country: NullableStringType(),
        region: NullableStringType(),
      }),
      Type.Null(),
    ],
    { default: null, description: "Address of the imported user" },
  ),
});
export type ProfileDetails = Static<typeof ProfileDetailsSchema>;

export const OrganisationSettingSchema = Type.Object({
  id: Type.String({
    format: "uuid",
    description: "Unique id of the organisation setting",
  }),
  userId: Type.String({
    format: "uuid",
    description: "Unique id of the related user",
  }),
  userProfileId: Type.Union([Type.Null(), Type.String()], {
    default: null,
    description: "Profile profile id, if available",
  }),
  phoneNumber: NullableStringType({
    description: "Phone number of the user",
  }),
  emailAddress: NullableStringType({
    description: "Email address of the user",
  }),
  organisationId: Type.String({
    description: "Unique id of the related organisation",
  }),
  details: Type.Optional(ProfileDetailsSchema),
});
export type OrganisationSetting = Static<typeof OrganisationSettingSchema>;

export const ProfilePerOrganisationSchema = Type.Composite([
  Type.Object({
    organisationSettingId: Type.String({
      format: "uuid",
      description: "Unique id of the organisation setting",
    }),
    firstName: NullableStringType({ description: "First name of the user" }),
    lastName: NullableStringType({ description: "Last name of the user" }),
    birthDate: NullableStringType({ description: "Birth date of the user" }),
    lang: NullableStringType({ description: "Preferred language of the user" }),
    ppsn: NullableStringType({ description: "PPSN of the user" }),
    id: Type.String({
      format: "uuid",
      description: "Unique id of the related user",
    }),
  }),
  Type.Omit(OrganisationSettingSchema, ["id", "userId"]),
]);
export type ProfilePerOrganisation = Static<
  typeof ProfilePerOrganisationSchema
>;

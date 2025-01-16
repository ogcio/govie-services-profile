import { type Static, Type } from "@sinclair/typebox";
import { TypeboxStringEnum } from "~/types/typebox.js";

export const AvailableDetailTypes = {
  String: "string",
  Number: "number",
  Boolean: "boolean",
  Date: "date",
};

export type DetailType = "string" | "number" | "boolean" | "date";

export const AvailableLanguagesSchema = TypeboxStringEnum(["en", "ga"], "en");

const ProfileDataStringItemSchema = Type.Object({
  value: Type.String(),
  type: Type.Literal("string"),
});

const ProfileDataDateItemSchema = Type.Object({
  value: Type.String(),
  type: Type.Literal("date"),
});

// Used as output schema to the clients
export const KnownProfileDataDetailsSchema = Type.Object({
  city: Type.Optional(Type.String()),
  email: Type.Optional(Type.String({ format: "email" })),
  address: Type.Optional(Type.String()),
  phone: Type.Optional(Type.String()),
  first_name: Type.Optional(Type.String()),
  last_name: Type.Optional(Type.String()),
  date_of_birth: Type.Optional(Type.String({ format: "date" })),
  ppsn: Type.Optional(Type.String()),
});

export type KnownProfileDataDetails = Static<
  typeof KnownProfileDataDetailsSchema
>;

export const ProfileSchema = Type.Object({
  id: Type.String(),
  public_name: Type.String(),
  email: Type.String({ format: "email" }),
  primary_user_id: Type.String(),
  safe_level: Type.Optional(Type.Number()),
  preferred_language: Type.Optional(AvailableLanguagesSchema),
  created_at: Type.Optional(Type.String({ format: "date-time" })),
  updated_at: Type.Optional(Type.String({ format: "date-time" })),
});

export const ProfileWithDetailsSchema = Type.Composite([
  ProfileSchema,
  Type.Object({ details: Type.Optional(KnownProfileDataDetailsSchema) }),
]);

export const ProfileListSchema = Type.Array(ProfileSchema);
export const ProfileWithDetailsListSchema = Type.Array(
  ProfileWithDetailsSchema,
);
export type Profile = Static<typeof ProfileSchema>;
export type ProfileWithDetails = Static<typeof ProfileWithDetailsSchema>;
export type ProfileList = Static<typeof ProfileListSchema>;
export type ProfileWithDetailsList = Static<
  typeof ProfileWithDetailsListSchema
>;

// Used to query the db
// build a type with same keys as KnownProfileDataDetails but
// where all the values are of type ProfileDataItemSchema
export const KnownProfileDbDataDetailsSchema = Type.Object({
  city: ProfileDataStringItemSchema,
  email: ProfileDataStringItemSchema,
  address: ProfileDataStringItemSchema,
  phone: ProfileDataStringItemSchema,
  first_name: ProfileDataStringItemSchema,
  last_name: ProfileDataStringItemSchema,
  date_of_birth: ProfileDataDateItemSchema,
  ppsn: ProfileDataStringItemSchema,
});

export type KnownProfileDbDataDetails = Static<
  typeof KnownProfileDbDataDetailsSchema
>;

export const ProfileWithDetailsFromDbSchema = Type.Composite([
  ProfileSchema,
  Type.Object({ details: Type.Optional(KnownProfileDbDataDetailsSchema) }),
]);

export type ProfileWithDetailsFromDb = Static<
  typeof ProfileWithDetailsFromDbSchema
>;
export const ProfileWithDetailsFromDbListSchema = Type.Array(
  ProfileWithDetailsFromDbSchema,
);
export type ProfileWithDetailsFromDbList = Static<
  typeof ProfileWithDetailsFromDbListSchema
>;

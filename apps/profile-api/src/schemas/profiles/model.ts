import { type Static, Type } from "@sinclair/typebox";

export const AvailableDetailTypes = {
  String: "string",
  Number: "number",
  Boolean: "boolean",
  Date: "date",
};

export type DetailType = "string" | "number" | "boolean" | "date";

// const ProfileDataItemSchema = Type.Object({
//   value: Type.String(),
//   type: TypeboxStringEnum(Object.values(AvailableDetailTypes)),
// });

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
  created_at: Type.Optional(Type.String({ format: "date-time" })),
  updated_at: Type.Optional(Type.String({ format: "date-time" })),
});

export const ProfileWithDataSchema = Type.Composite([
  ProfileSchema,
  Type.Object({ details: Type.Optional(KnownProfileDataDetailsSchema) }),
]);

export const ProfileListSchema = Type.Array(ProfileSchema);
export const ProfileWithDataListSchema = Type.Array(ProfileWithDataSchema);
export type Profile = Static<typeof ProfileSchema>;
export type ProfileWithData = Static<typeof ProfileWithDataSchema>;
export type ProfileList = Static<typeof ProfileListSchema>;
export type ProfileWithDataList = Static<typeof ProfileWithDataListSchema>;

// Used to query the db
// build a type with same keys as KnownProfileDataDetails but
// where all the values are of type ProfileDataItemSchema
export const KnownProfileDbDataDetails = Type.Object({
  city: ProfileDataStringItemSchema,
  email: ProfileDataStringItemSchema,
  address: ProfileDataStringItemSchema,
  phone: ProfileDataStringItemSchema,
  first_name: ProfileDataStringItemSchema,
  last_name: ProfileDataStringItemSchema,
  date_of_birth: ProfileDataDateItemSchema,
  ppsn: ProfileDataStringItemSchema,
});

export const ProfileWithDataFromDbSchema = Type.Composite([
  ProfileSchema,
  Type.Object({ details: Type.Optional(KnownProfileDbDataDetails) }),
]);

export type ProfileWithDataFromDb = Static<typeof ProfileWithDataFromDbSchema>;
export const ProfileWithDataFromDbListSchema = Type.Array(
  ProfileWithDataFromDbSchema,
);
export type ProfileWithDataFromDbList = Static<
  typeof ProfileWithDataFromDbListSchema
>;

import { type Static, Type } from "@sinclair/typebox";

const ProfileDataItemSchema = Type.Object({
  value: Type.String(),
  type: Type.String(),
});

const ProfileDataSchema = Type.Object({
  city: Type.Optional(ProfileDataItemSchema),
  email: Type.Optional(ProfileDataItemSchema),
  address: Type.Optional(ProfileDataItemSchema),
  phone: Type.Optional(ProfileDataItemSchema),
  first_name: Type.Optional(ProfileDataItemSchema),
  last_name: Type.Optional(ProfileDataItemSchema),
  date_of_birth: Type.Optional(ProfileDataItemSchema),
});

export const ProfileWithDataSchema = Type.Composite([
  Type.Object({
    id: Type.String(),
    public_name: Type.String(),
    email: Type.String(),
    primary_user_id: Type.String(),
    safe_level: Type.Optional(Type.Number()),
    created_at: Type.Optional(Type.String({ format: "date-time" })),
    updated_at: Type.Optional(Type.String({ format: "date-time" })),
    details: ProfileDataSchema,
  }),
]);
export const ProfileWithDataListSchema = Type.Array(ProfileWithDataSchema);

export type ProfileWithData = Static<typeof ProfileWithDataSchema>;
export type ProfileWithDataList = Static<typeof ProfileWithDataListSchema>;

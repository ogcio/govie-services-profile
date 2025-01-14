import { type Static, Type } from "@sinclair/typebox";

export const ProfileDetailsSchema = Type.Object({
  city: Type.Optional(Type.String()),
  email: Type.Optional(Type.String()),
  address: Type.Optional(Type.String()),
  phone: Type.Optional(Type.String()),
  first_name: Type.Optional(Type.String()),
  last_name: Type.Optional(Type.String()),
  date_of_birth: Type.Optional(Type.String()),
});

export type ProfileDetails = Static<typeof ProfileDetailsSchema>;

export const ProfileWithDataSchema = Type.Composite([
  Type.Object({
    id: Type.String(),
    public_name: Type.String(),
    email: Type.String(),
    primary_user_id: Type.String(),
    safe_level: Type.Optional(Type.Number()),
    created_at: Type.Optional(Type.String({ format: "date-time" })),
    updated_at: Type.Optional(Type.String({ format: "date-time" })),
    details: ProfileDetailsSchema,
  }),
]);
export type ProfileWithData = Static<typeof ProfileWithDataSchema>;

export const ProfileWithDataListSchema = Type.Array(ProfileWithDataSchema);
export type ProfileWithDataList = Static<typeof ProfileWithDataListSchema>;

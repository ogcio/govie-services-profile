import { type Static, Type } from "@sinclair/typebox";
import { getWithIdAndTimestamps } from "~/utils/get-with-id-and-timestamps.js";

const ProfileSchema = Type.Object({
  public_name: Type.String(),
  email: Type.String({ format: "email" }),
  primary_user_id: Type.String(),
});

const FullProfileSchema = getWithIdAndTimestamps(ProfileSchema, true);
type FullProfile = Static<typeof FullProfileSchema>;

const ProfileToImportDetailSchema = Type.Object({
  address: Type.String(),
  city: Type.String(),
  first_name: Type.String(),
  last_name: Type.String(),
  email: Type.String({ format: "email" }),
  phone: Type.String(),
  date_of_birth: Type.String({ format: "date" }),
});

const ImportProfilesSchema = Type.Array(ProfileToImportDetailSchema);
type ProfileToImportDetail = Static<typeof ProfileToImportDetailSchema>;

const FullProfileWithDetailsSchema = Type.Composite([
  FullProfileSchema,
  Type.Object({ details: ProfileToImportDetailSchema }),
]);

const ImportOutputSchema = Type.Array(FullProfileWithDetailsSchema);

type FullProfileWithDetails = Static<typeof FullProfileWithDetailsSchema>;

type ImportProfiles = Static<typeof ImportProfilesSchema>;

export type {
  FullProfile,
  FullProfileWithDetails,
  ImportProfiles,
  ProfileToImportDetail,
};

export {
  FullProfileSchema,
  FullProfileWithDetailsSchema,
  ImportProfilesSchema,
  ProfileToImportDetailSchema,
  ImportOutputSchema,
};

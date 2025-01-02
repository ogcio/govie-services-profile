// import { type Static, Type } from "@sinclair/typebox";
// import { getWithIdAndTimestamps } from "~/utils/get-with-id-and-timestamps.js";

// const ProfileSchema = Type.Object({
//   public_name: Type.String(),
//   email: Type.String({ format: "email" }),
//   primary_user_id: Type.String(),
// });

// const FullProfileSchema = getWithIdAndTimestamps(ProfileSchema, true);
// type FullProfile = Static<typeof FullProfileSchema>;

// const FullProfileWithDetailsSchema = Type.Composite([
//   FullProfileSchema,
//   Type.Object({ details: ProfileToImportDetailSchema }),
// ]);

// const ImportOutputSchema = Type.Array(FullProfileWithDetailsSchema);

// type FullProfileWithDetails = Static<typeof FullProfileWithDetailsSchema>;

// export type {
//   FullProfile,
//   FullProfileWithDetails,
// };

// export {
//   FullProfileSchema,
//   FullProfileWithDetailsSchema,
//   ImportOutputSchema,
// };

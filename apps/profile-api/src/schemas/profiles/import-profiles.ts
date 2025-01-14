import { type Static, Type } from "@sinclair/typebox";
import { PROFILES_TAG } from "./shared.js";

export const ImportProfilesSchema = {
  tags: [PROFILES_TAG],
  operationId: "importProfiles",
  body: Type.Array(
    Type.Object({
      address: Type.String(),
      city: Type.String(),
      first_name: Type.String(),
      last_name: Type.String(),
      email: Type.String({ format: "email" }),
      phone: Type.String(),
      date_of_birth: Type.String({ format: "date" }),
    }),
    { minItems: 1 },
  ),
};

export type ImportProfilesBody = Static<typeof ImportProfilesSchema.body>;

import { type Static, Type } from "@sinclair/typebox";
import { ImportStatus } from "~/const/index.js";
import { HttpError } from "~/types/index.js";
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
      preferred_language: Type.Optional(Type.String({ enum: ["en", "ga"] })),
    }),
    { minItems: 1 },
  ),
  response: {
    200: Type.Object({
      status: Type.Enum(ImportStatus),
    }),
    "4xx": HttpError,
    "5xx": HttpError,
  },
};

export type ImportProfilesBody = Static<typeof ImportProfilesSchema.body>;

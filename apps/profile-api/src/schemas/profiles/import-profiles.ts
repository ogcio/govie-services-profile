import { type Static, Type } from "@sinclair/typebox";
import { MimeTypes } from "~/const/mime-types.js";
import { HttpError } from "~/types/index.js";
import { KnownProfileDataDetailsSchema } from "./model.js";
import { PROFILES_TAG } from "./shared.js";

export const ImportProfilesResponseSchema = Type.Object({
  status: Type.String(),
  jobId: Type.String(),
});

export const ImportProfileFromJsonSchema = Type.Array(
  KnownProfileDataDetailsSchema,
  { minItems: 1 },
);

export const CsvFileSchema = Type.Any();

export const ImportProfileBodySchema = Type.Object({
  profiles: Type.Optional(ImportProfileFromJsonSchema),
  file: Type.Optional(CsvFileSchema),
});

export const ImportProfilesSchema = {
  consumes: [MimeTypes.Json, MimeTypes.FormData, MimeTypes.Csv],
  body: ImportProfileBodySchema,
  tags: [PROFILES_TAG],
  operationId: "importProfiles",
  response: {
    200: ImportProfilesResponseSchema,
    "4xx": HttpError,
    "5xx": HttpError,
  },
};

export type ImportProfilesBody = Static<typeof ImportProfileBodySchema>;
export type CsvFile = Static<typeof CsvFileSchema>;

import { type Static, Type } from "@sinclair/typebox";
import type { FastifySchema } from "fastify";
import { MimeTypes } from "~/const/mime-types.js";
import { HttpError } from "~/types/index.js";
import { PROFILES_TAG } from "./shared.js";

export const ImportProfilesResponseSchema = Type.Object({
  status: Type.String(),
  jobId: Type.String(),
});

export const ImportProfileFromJsonSchema = Type.Array(
  Type.Object({
    address: Type.String(),
    city: Type.String(),
    firstName: Type.String(),
    lastName: Type.String(),
    email: Type.String({ format: "email" }),
    phone: Type.String(),
    dateOfBirth: Type.String({ format: "date" }),
    ppsn: Type.Optional(Type.String()),
    preferredLanguage: Type.Optional(
      Type.Enum({ en: "en", ga: "ga" }, { default: "en" }),
    ),
  }),
  { minItems: 1 },
);

export const ImportProfileFromMultipartSchema = Type.Object({
  filename: Type.String(),
  encoding: Type.String(),
  mimetype: Type.String({ enum: ["text/csv"] }),
  file: Type.Any(),
});

export const ImportProfileBodySchema = Type.Object({
  profiles: Type.Optional(ImportProfileFromJsonSchema),
  file: Type.Optional(ImportProfileFromMultipartSchema),
});

export const ImportProfilesSchema: FastifySchema = {
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

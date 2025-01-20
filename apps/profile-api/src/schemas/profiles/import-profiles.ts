import { type Static, Type } from "@sinclair/typebox";
import type { FastifySchema } from "fastify";
import { MimeTypes } from "~/const/mime-types.js";
import { HttpError } from "~/types/index.js";
import { getGenericResponseSchema } from "~/utils/index.js";
import { AvailableLanguagesSchema } from "./index.js";
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
    preferredLanguage: Type.Optional(AvailableLanguagesSchema),
  }),
);

export const ImportProfileFromMultipartSchema = Type.Object({
  file: Type.Object({
    type: Type.String(),
    encoding: Type.String(),
    mimetype: Type.String(),
    buffer: Type.Any(),
  }),
});

export const ImportProfilesSchema: FastifySchema = {
  consumes: [MimeTypes.Json, MimeTypes.FormData],
  body: Type.Union([
    ImportProfileFromJsonSchema,
    ImportProfileFromMultipartSchema,
  ]),
  tags: [PROFILES_TAG],
  operationId: "importProfiles",
  response: {
    200: getGenericResponseSchema(ImportProfilesResponseSchema),
    "4xx": HttpError,
    "5xx": HttpError,
  },
};

export type ImportProfilesBody = Static<typeof ImportProfileFromJsonSchema>;

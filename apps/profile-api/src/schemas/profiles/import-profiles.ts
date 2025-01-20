import { type Static, Type } from "@sinclair/typebox";
import type { FastifySchema } from "fastify";
import { MimeTypes } from "~/const/mime-types.js";
import { AvailableLanguagesSchema } from "./index.js";

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
};

export type ImportProfilesBody = Static<typeof ImportProfileFromJsonSchema>;

import { Type } from "@sinclair/typebox";
import { PaginationParamsSchema } from "~/schemas/pagination.js";
import { HttpError } from "~/types/http-error.js";
import { getGenericResponseSchema } from "~/utils/index.js";

export const ProfileImportListSchema = Type.Array(
  Type.Object({
    id: Type.String({ format: "uuid" }),
    jobId: Type.String(),
    organisationId: Type.Optional(Type.String()),
    status: Type.String(),
    source: Type.Union([Type.Literal("csv"), Type.Literal("json")]),
    metadata: Type.Optional(
      Type.Object({
        filename: Type.String(),
        mimetype: Type.String(),
      }),
    ),
    createdAt: Type.String({ format: "date-time" }),
    updatedAt: Type.String({ format: "date-time" }),
  }),
);

export const ListProfileImportsSchema = {
  description: "List profile imports with pagination",
  tags: ["profiles"],
  querystring: Type.Composite([
    Type.Object({
      organizationId: Type.Optional(Type.String()),
      source: Type.Optional(
        Type.Union([Type.Literal("csv"), Type.Literal("json")]),
      ),
    }),
    PaginationParamsSchema,
  ]),
  response: {
    200: getGenericResponseSchema(ProfileImportListSchema),
    "4xx": HttpError,
    "5xx": HttpError,
  },
};

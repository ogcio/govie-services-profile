import { Type } from "@sinclair/typebox";
import { HttpError } from "~/types/index.js";
import { getGenericResponseSchema } from "~/utils/index.js";
import { ProfileWithDataSchema } from "./model.js";
import { PROFILES_TAG } from "./shared.js";

export const FindProfileSchema = {
  tags: [PROFILES_TAG],
  operationId: "findProfile",
  querystring: Type.Object(
    {
      email: Type.Optional(
        Type.String({
          format: "email",
          description: "Email address to search for",
        }),
      ),
      firstName: Type.Optional(
        Type.String({
          description: "First name to search for",
        }),
      ),
      lastName: Type.Optional(
        Type.String({
          description: "Last name to search for",
        }),
      ),
      phone: Type.Optional(
        Type.String({
          description: "Phone number to search for",
        }),
      ),
    },
    {
      // Require at least one search parameter
      additionalProperties: false,
      minProperties: 1, // at least one search field
    },
  ),
  response: {
    200: getGenericResponseSchema(ProfileWithDataSchema),
    "4xx": HttpError,
    "5xx": HttpError,
  },
};

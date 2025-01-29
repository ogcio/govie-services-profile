import { Type } from "@sinclair/typebox";
import { PaginationParamsSchema } from "~/schemas/pagination.js";
import { HttpError } from "~/types/http-error.js";
import { getGenericResponseSchema } from "~/utils/index.js";
import { PROFILES_TAG } from "./constants.js";
import { ProfileListSchema } from "./index.js";

export const ProfilesIndexSchema = {
  tags: [PROFILES_TAG],
  operationId: "indexProfiles",
  querystring: Type.Composite([
    Type.Object({
      search: Type.Optional(
        Type.String({
          description:
            "If set, the endpoint searches for users whom contain this value in either the public name or the email address",
        }),
      ),
    }),
    PaginationParamsSchema,
  ]),
  response: {
    200: getGenericResponseSchema(ProfileListSchema),
    "4xx": HttpError,
    "5xx": HttpError,
  },
};

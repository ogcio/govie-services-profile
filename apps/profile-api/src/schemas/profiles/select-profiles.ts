import { Type } from "@sinclair/typebox";
import { HttpError } from "~/types/index.js";
import { getGenericResponseSchema } from "~/utils/index.js";
import { PROFILES_TAG } from "./constants.js";
import { ProfileWithDetailsListSchema } from "./index.js";

export const SelectProfilesSchema = {
  tags: [PROFILES_TAG],
  operationId: "selectProfiles",
  querystring: Type.Object({
    ids: Type.String({
      description: "Comma-separated list of profile IDs",
      pattern: "^[a-zA-Z0-9-]+(,[a-zA-Z0-9-]+)*$",
    }),
  }),
  response: {
    200: getGenericResponseSchema(ProfileWithDetailsListSchema),
    "4xx": HttpError,
    "5xx": HttpError,
  },
};

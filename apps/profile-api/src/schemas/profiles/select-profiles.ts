import { type Static, Type } from "@sinclair/typebox";
import { HttpError } from "~/types/index.js";
import { getGenericResponseSchema } from "~/utils/index.js";
import { ProfileWithDataListSchema } from "./index.js";
import { PROFILES_TAG } from "./shared.js";

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
    200: getGenericResponseSchema(ProfileWithDataListSchema),
    "4xx": HttpError,
    "5xx": HttpError,
  },
};

export type SelectProfilesQueryParams = Static<
  typeof SelectProfilesSchema.querystring
>;

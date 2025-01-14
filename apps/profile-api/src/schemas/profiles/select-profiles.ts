import { type Static, Type } from "@sinclair/typebox";
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
};

export type SelectProfilesQueryParams = Static<
  typeof SelectProfilesSchema.querystring
>;

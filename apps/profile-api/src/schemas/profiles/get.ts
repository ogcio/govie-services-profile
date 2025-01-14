import { type Static, Type } from "@sinclair/typebox";
import { PROFILES_TAG } from "./shared.js";

export const GetProfileSchema = {
  tags: [PROFILES_TAG],
  operationId: "getProfile",
  params: Type.Object({
    profileId: Type.String({
      description: "ID of the profile to retrieve",
    }),
  }),
  querystring: Type.Object({
    organizationId: Type.Optional(Type.String()),
  }),
};

export type GetProfileParams = Static<typeof GetProfileSchema.params>;

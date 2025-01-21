import { Type } from "@sinclair/typebox";
import { HttpError } from "~/types/index.js";
import { getGenericResponseSchema } from "~/utils/index.js";
import { ProfileWithDetailsSchema } from "./index.js";
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
  response: {
    200: getGenericResponseSchema(ProfileWithDetailsSchema),
    "4xx": HttpError,
    "5xx": HttpError,
  },
};

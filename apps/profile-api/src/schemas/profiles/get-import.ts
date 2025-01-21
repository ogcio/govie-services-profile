import { Type } from "@sinclair/typebox";
import { HttpError } from "~/types/index.js";
import { getGenericResponseSchema } from "~/utils/index.js";
import { KnownProfileDataDetailsSchema } from "./model.js";
import { PROFILES_TAG } from "./shared.js";

export const GetProfileImportDetailsSchema = {
  tags: [PROFILES_TAG],
  description: "Get details of profiles in a specific import",
  operationId: "getProfileImportDetails",
  params: Type.Object({
    importId: Type.String(),
  }),
  response: {
    200: getGenericResponseSchema(Type.Array(KnownProfileDataDetailsSchema)),
    "4xx": HttpError,
    "5xx": HttpError,
  },
} as const;

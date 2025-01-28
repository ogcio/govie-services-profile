import { Type } from "@sinclair/typebox";
import { HttpError } from "~/types/index.js";
import { PROFILES_TAG } from "./constants.js";

export const GetProfileTemplateSchema = {
  tags: [PROFILES_TAG],
  operationId: "getProfileTemplate",
  response: {
    200: Type.Object({
      type: Type.Literal("Buffer"),
      data: Type.Array(Type.Number()),
    }),
    "4xx": HttpError,
    "5xx": HttpError,
  },
  produces: ["text/csv"],
};

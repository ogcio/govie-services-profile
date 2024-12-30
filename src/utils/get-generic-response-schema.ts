import { type TSchema, Type } from "@sinclair/typebox";
import { ResponseMetadataSchema } from "~/types/generic-response.js";

export const getGenericResponseSchema = <T extends TSchema>(dataType: T) =>
  Type.Object({
    data: dataType,
    metadata: ResponseMetadataSchema,
  });

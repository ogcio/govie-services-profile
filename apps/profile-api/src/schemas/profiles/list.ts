import { type Static, Type } from "@sinclair/typebox";
import { PaginationParamsSchema } from "~/schemas/pagination.js";
import { getGenericResponseSchema } from "~/utils/index.js";
import { ProfileWithDataListSchema } from "./model.js";
import { PROFILES_TAG } from "./shared.js";

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
};

export type ProfilesIndexQueryParams = Static<
  typeof ProfilesIndexSchema.querystring
>;

export const ProfilesIndexResponseSchema = getGenericResponseSchema(
  ProfileWithDataListSchema,
);
export type ProfilesIndexResponse = Static<typeof ProfilesIndexResponseSchema>;

import { type Static, Type } from "@sinclair/typebox";
import {
  PAGINATION_LIMIT_DEFAULT,
  PAGINATION_MAX_LIMIT,
  PAGINATION_MIN_OFFSET,
} from "~/const/pagination.js";
import { getPaginationLinkSchema } from "~/utils/get-pagination-link-schema.js";

const PaginationParamsSchema = Type.Object({
  offset: Type.Optional(
    Type.String({
      pattern: "^[0-9][0-9]*|undefined$",
      default: PAGINATION_MIN_OFFSET.toString(),
      description:
        "Indicates where to start fetching data or how many records to skip, defining the initial position within the list",
    }),
  ),
  limit: Type.Optional(
    Type.String({
      default: PAGINATION_LIMIT_DEFAULT.toString(),
      pattern: `^([1-9]|${PAGINATION_MAX_LIMIT})|undefined$`,
      description: `Indicates the maximum number (${PAGINATION_MAX_LIMIT}) of items that will be returned in a single request`,
    }),
  ),
});

type PaginationParams = Static<typeof PaginationParamsSchema>;

const PaginationLinksSchema = Type.Object(
  {
    self: getPaginationLinkSchema("URL pointing to the request itself"),
    next: Type.Optional(
      getPaginationLinkSchema(
        "URL pointing to the next page of results in a paginated response. If there are no more results, this field may be omitted",
      ),
    ),
    prev: Type.Optional(
      getPaginationLinkSchema(
        "URL pointing to the previous page of results in a paginated response. If there are no more results, this field may be omitted",
      ),
    ),
    first: getPaginationLinkSchema(
      "URL pointing to the first page of results in a paginated response",
    ),
    last: getPaginationLinkSchema(
      "URL pointing to the first page of results in a paginated response",
    ),
    pages: Type.Record(Type.String(), getPaginationLinkSchema(), {
      description:
        "It may contain a list of other useful URLs, e.g. one entry for page:'page 1', 'page 2'",
    }),
  },
  { description: "Object containing the links to the related endpoints" },
);

type PaginationLinks = Static<typeof PaginationLinksSchema>;

type PaginationDetails = {
  offset?: number;
  limit?: number;
  url: URL;
};

export type { PaginationParams, PaginationLinks, PaginationDetails };
export { PaginationParamsSchema, PaginationLinksSchema };

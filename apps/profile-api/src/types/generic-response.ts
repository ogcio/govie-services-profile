import { type Static, Type } from "@sinclair/typebox";
import { PaginationLinksSchema } from "~/schemas/pagination.js";

const ResponseMetadataSchema = Type.Optional(
  Type.Object({
    links: Type.Optional(PaginationLinksSchema),
    totalCount: Type.Optional(
      Type.Number({
        description: "Number representing the total number of available items",
      }),
    ),
  }),
);

type GenericResponse<T> = {
  data: T;
  metadata?: Static<typeof ResponseMetadataSchema>;
};

export { ResponseMetadataSchema };
export type { GenericResponse };

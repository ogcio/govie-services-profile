import { Type } from "@sinclair/typebox";

export const getPaginationLinkSchema = (description?: string) =>
  Type.Object({
    href: Type.Optional(Type.String({ description })),
  });

import { type TSchema, Type } from "@sinclair/typebox";

export const getWithIdAndTimestamps = <T extends TSchema>(
  input: T,
  updatedAtToo: boolean,
) =>
  updatedAtToo
    ? Type.Composite([
        Type.Object({
          id: Type.String(),
          created_at: Type.String({ format: "date-time" }),
          updated_at: Type.String({ format: "date-time" }),
        }),
        input,
      ])
    : Type.Composite([
        Type.Object({
          id: Type.String(),
          created_at: Type.String({ format: "date-time" }),
        }),
        input,
      ]);

import { Type } from "@sinclair/typebox";

const TypeboxStringEnum = <T extends string[]>(
  items: [...T],
  defaultValue?: string,
  description?: string,
) =>
  Type.Unsafe<T[number]>({
    type: "string",
    enum: items,
    default: defaultValue,
    description,
  });

type AcceptedQueryBooleanValues = "true" | "false" | "0" | "1";

// Did this to allow boolean-like
// query parameters
const TypeboxBooleanEnum = (defaultValue?: string, description?: string) =>
  TypeboxStringEnum(["true", "false", "0", "1"], defaultValue, description);

const TypeboxBooleanEnumParser = Type.Transform(
  Type.Union([
    Type.Literal("true"),
    Type.Literal("false"),
    Type.Literal("0"),
    Type.Literal("1"),
  ]),
)
  .Decode((stringValue) => Boolean(stringValue))
  .Encode((boolVal) => (boolVal ? "true" : "false"));

export type { AcceptedQueryBooleanValues };
export { TypeboxStringEnum, TypeboxBooleanEnum, TypeboxBooleanEnumParser };

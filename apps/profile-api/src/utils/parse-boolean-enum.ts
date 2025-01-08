import { Value } from "@sinclair/typebox/value";
import {
  type AcceptedQueryBooleanValues,
  TypeboxBooleanEnumParser,
} from "~/types/typebox.js";

export const parseBooleanEnum = (inputValue: AcceptedQueryBooleanValues) =>
  Value.Decode(TypeboxBooleanEnumParser, inputValue);

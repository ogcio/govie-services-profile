import { Value } from "@sinclair/typebox/value";
import {
  type AcceptedQueryBooleanValues,
  TypeboxBooleanEnumParser,
} from "~/types/index.js";

export const parseBooleanEnum = (inputValue: AcceptedQueryBooleanValues) =>
  Value.Decode(TypeboxBooleanEnumParser, inputValue);

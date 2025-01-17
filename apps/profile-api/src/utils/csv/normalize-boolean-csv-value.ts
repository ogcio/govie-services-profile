import { normalizeCsvValue } from "./normalize-csv-value.js";

export const normalizeBooleanCsvValue = (
  value: string | undefined | null | boolean,
): boolean => {
  if (typeof value === "boolean") {
    return value;
  }

  const normalizedString = normalizeCsvValue(value);

  if (!normalizedString) {
    return false;
  }

  return normalizedString === "1" || normalizedString.toLowerCase() === "true";
};

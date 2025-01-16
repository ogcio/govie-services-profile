export const isISODate = (value: string): boolean => {
  // ISO 8601 regex pattern
  const isoPattern =
    /^\d{4}-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12]\d|3[01])(?:T(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d(?:\.\d+)?(?:Z|[-+]\d{2}:?\d{2})?)?$/;

  if (!isoPattern.test(value)) {
    return false;
  }

  const date = new Date(value);
  return date instanceof Date && !Number.isNaN(date.getTime());
};

export const toIsoDate = (value: string): string => {
  const date = new Date(value);
  return date.toISOString();
};

export const isISODate = (value: string): boolean => {
  const date = new Date(value);
  return (
    date instanceof Date && !Number.isNaN(date.getTime()) && value.includes("-")
  );
};

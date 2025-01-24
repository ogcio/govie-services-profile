import dayjs from "dayjs";
import utc from 'dayjs/plugin/utc';
dayjs.extend(utc);

export * as postgres from "./postgres";
export * as form from "./form";
export * as routes from "./routes";

export function formatDate(date: string | Date) {
  return dayjs(date).format("DD/MM/YYYY");
}

export function getDayMonthYear(date: string) {
  const d = dayjs.utc(date)
  const isValid = d.isValid()
  return {
    day: isValid ? d.date() : null,
    month: isValid ? d.get("month") + 1 : null,
    year: isValid ? d.get("year") : null
  }
}

export function stringToAsterisk(str: string) {
  return str.replace(/./g, '*');
}

export function cleanObjectFromNullOrUndefined(obj: Record<string, unknown>, defaultValue = '') {
  const transformed = {};

  for (let key in obj) {
    if (obj.hasOwnProperty(key)) {
      transformed[key] = obj[key] ?? defaultValue;
    }
  }

  return transformed;
}
import type { PoolClient } from "pg";
import { isISODate } from "~/utils/is-iso-date.js";

export const createProfileDataForProfileDetail = async (
  client: PoolClient,
  profileDetailId: string,
  data: Record<string, string | number>,
) => {
  const entries = Object.entries(data);
  const names: string[] = [];
  const valueTypes: string[] = [];
  const values: string[] = [];

  const getValueType = (
    value: unknown,
  ): "string" | "number" | "boolean" | "date" => {
    if (typeof value === "number") return "number";
    if (typeof value === "boolean") return "boolean";
    if (typeof value === "string" && isISODate(value)) return "date";
    return "string";
  };

  for (const [key, value] of entries) {
    names.push(key);
    valueTypes.push(getValueType(value));
    values.push(value.toString());
  }

  const query = `
    INSERT INTO profile_data (
      profile_details_id,
      name,
      value_type,
      value
    ) 
    SELECT 
      $1,
      unnest($2::text[]),
      unnest($3::text[]),
      unnest($4::text[])
  `;

  await client.query(query, [profileDetailId, names, valueTypes, values]);
};

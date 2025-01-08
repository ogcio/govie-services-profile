import type { PoolClient } from "pg";
import { isISODate } from "~/utils/is-iso-date.js";

export const createProfileDataForProfileDetail = async (
  client: PoolClient,
  profileDetailId: string,
  data: Record<string, string | number | boolean | Date>,
): Promise<void> => {
  const entries = Object.entries(data);

  if (entries.length === 0) {
    return;
  }

  const values = entries
    .map((_, index) => {
      const baseIndex = index * 3 + 2; // Start from $2 since $1 is profileDetailId
      return `($1, $${baseIndex}, $${baseIndex + 1}, $${baseIndex + 2})`;
    })
    .join(",");

  const params = [profileDetailId];
  const getValueType = (
    value: unknown,
  ): "string" | "number" | "boolean" | "date" => {
    if (typeof value === "number") return "number";
    if (typeof value === "boolean") return "boolean";
    if (typeof value === "string" && isISODate(value)) return "date";
    return "string";
  };
  for (const [key, value] of entries) {
    params.push(
      key, // name
      getValueType(value), // value_type
      value.toString(), // value
    );
  }

  const query = `
    INSERT INTO profile_data (
      profile_details_id,
      name,
      value_type,
      value
    ) VALUES ${values}
  `;

  await client.query(query, params);
};

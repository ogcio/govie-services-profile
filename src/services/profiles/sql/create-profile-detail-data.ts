import type { PoolClient } from "pg";

const isISODate = (value: string): boolean => {
  const date = new Date(value);
  return (
    date instanceof Date && !Number.isNaN(date.getTime()) && value.includes("-")
  );
};

const getValueType = (
  value: unknown,
): "string" | "number" | "boolean" | "date" => {
  if (typeof value === "number") return "number";
  if (typeof value === "boolean") return "boolean";
  if (typeof value === "string" && isISODate(value)) return "date";
  return "string";
};

export const createProfileDetailData = async (
  client: PoolClient,
  profileDetailId: string,
  data: Record<string, string | number>,
) => {
  const entries = Object.entries(data);

  const values = entries
    .map((_, index) => {
      const baseIndex = index * 3 + 2; // Start from $2 since $1 is profileDetailId
      return `($1, $${baseIndex}, $${baseIndex + 1}, $${baseIndex + 2})`;
    })
    .join(",");

  const params = [profileDetailId];
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

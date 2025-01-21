import { httpErrors } from "@fastify/sensible";
import type { PoolClient } from "pg";
import type { KnownProfileDataDetails } from "~/schemas/profiles/index.js";

const isValidProfileData = (data: unknown): data is KnownProfileDataDetails => {
  if (typeof data !== "object" || data === null) return false;
  const profile = data as Record<string, unknown>;
  return (
    typeof profile.firstName === "string" &&
    typeof profile.lastName === "string" &&
    typeof profile.email === "string"
  );
};

export const getProfileImportDetails = async (
  client: PoolClient,
  importId: string,
): Promise<KnownProfileDataDetails[]> => {
  if (!importId) {
    throw httpErrors.badRequest("Profile import ID is required");
  }

  const result = await client.query<{ data: unknown }>(
    `SELECT data
    FROM profile_import_details
    WHERE profile_import_id = $1 
    AND data IS NOT NULL
    ORDER BY created_at DESC;`,
    [importId],
  );

  if (result.rows.length === 0) {
    throw httpErrors.notFound(
      `No import details found for import ID: ${importId}`,
    );
  }

  return result.rows.map((row) => {
    if (!isValidProfileData(row.data)) {
      throw httpErrors.badRequest("Invalid profile data format");
    }
    console.dir(row.data, { depth: null });
    return row.data;
  });
};

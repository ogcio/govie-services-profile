import { httpErrors } from "@fastify/sensible";
import type { PoolClient } from "pg";
import type { SavedFileInfo } from "~/utils/save-request-file.js";

export const getProfileImport = async (
  client: PoolClient,
  id: string,
): Promise<{ organisationId: string; metadata: SavedFileInfo["metadata"] }> => {
  const result = await client.query<{
    organisation_id: string;
    metadata: SavedFileInfo["metadata"];
  }>(
    "SELECT organisation_id, metadata FROM profile_imports WHERE id = $1 LIMIT 1;",
    [id],
  );

  if (!result.rows[0]?.metadata) {
    throw httpErrors.notFound(
      `Status for profile_import with id ${id} not found`,
    );
  }

  return {
    organisationId: result.rows[0].organisation_id,
    metadata: result.rows[0].metadata,
  };
};

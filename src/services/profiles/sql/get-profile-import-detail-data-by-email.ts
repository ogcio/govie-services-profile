import { httpErrors } from "@fastify/sensible";
import type { PoolClient } from "pg";
import type { ImportProfilesBody } from "~/schemas/profiles/import.js";

export class ProfileImportDetailNotFoundError extends httpErrors.HttpError {
  constructor(message: string) {
    super(message);
    this.name = "ProfileImportDetailNotFoundError";
    this.status = 404;
    this.statusCode = 404;
  }
}

export const getProfileImportDetailDataByEmail = async (
  client: PoolClient,
  profileImportId: string,
  email: string,
): Promise<ImportProfilesBody[0]> => {
  if (!profileImportId) {
    throw httpErrors.badRequest("Profile import ID is required");
  }
  if (!email) {
    throw httpErrors.badRequest("Email is required");
  }

  const result = await client.query<{ profile: ImportProfilesBody[0] }>(
    `
    SELECT data as profile
    FROM profile_import_details
    WHERE profile_import_id = $1 
    AND data->>'email' = $2 
    AND data IS NOT NULL
    LIMIT 1;`,
    [profileImportId, email],
  );

  const profile = result.rows[0]?.profile;
  if (!profile) {
    throw new ProfileImportDetailNotFoundError(
      `No import detail found for email: ${email} in import: ${profileImportId}`,
    );
  }

  return profile;
};

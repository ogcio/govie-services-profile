import type { Pool } from "pg";
import type { KnownProfileDataDetails } from "~/schemas/profiles/index.js";
import { withClient } from "~/utils/index.js";
import { getProfileImportDetails as getProfileImportDetailsSQL } from "./sql/get-profile-import-details.js";

export const getProfileImportDetails = async (
  pool: Pool,
  importId: string,
): Promise<KnownProfileDataDetails[]> =>
  withClient(pool, async (client) =>
    getProfileImportDetailsSQL(client, importId),
  );

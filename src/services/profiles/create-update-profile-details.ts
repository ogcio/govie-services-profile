import type { PoolClient } from "pg";
import { withClient } from "~/utils/with-client.js";
import { withRollback } from "~/utils/with-rollback.js";
import {
  createProfileDataForProfileDetail,
  createProfileDetails,
  updateProfileDetails,
} from "./sql/index.js";

export const createUpdateProfileDetails = async (
  client: PoolClient,
  organizationId: string,
  profileId: string,
  data: Record<string, string | number>,
) => {
  await withClient(client, async (client) => {
    await withRollback(client, async () => {
      const profileDetailId = await createProfileDetails(
        client,
        profileId,
        organizationId,
      );

      await createProfileDataForProfileDetail(client, profileDetailId, data);

      await updateProfileDetails(
        client,
        profileDetailId,
        organizationId,
        profileId,
      );
    });
  });
};

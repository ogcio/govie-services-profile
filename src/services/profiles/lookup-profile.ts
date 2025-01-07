import type { PoolClient } from "pg";
import { withClient } from "~/utils/with-client.js";
import { findProfileDetail } from "./sql/find-profile-detail.js";
import { findProfileByEmail, findProfileDataByEmail } from "./sql/index.js";

export const lookupProfile = async (client: PoolClient, email: string) => {
  let existingProfileId = await withClient(client, async (client) => {
    return await findProfileByEmail(client, email);
  });
  let existingProfileDetailId: string | undefined;
  // TODO: join in 1 query
  if (!existingProfileId) {
    existingProfileDetailId = await withClient(client, async (client) => {
      return await findProfileDataByEmail(client, email);
    });
    if (existingProfileDetailId) {
      existingProfileId = await withClient(client, async (client) => {
        return await findProfileDetail(
          client,
          existingProfileDetailId as string,
        );
      });
    }
  }

  return {
    exists: Boolean(existingProfileId || existingProfileDetailId),
    profileId: existingProfileId,
    profileDetailId: existingProfileDetailId,
  };
};

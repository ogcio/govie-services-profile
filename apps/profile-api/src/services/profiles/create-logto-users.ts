import { getAccessToken } from "@ogcio/api-auth";
import { LogtoClient } from "~/clients/logto.js";
import type { EnvConfig } from "~/plugins/external/env.js";
import type { KnownProfileDataDetails } from "~/schemas/profiles/index.js";

interface LogtoUserResult {
  id: string;
  primaryEmail: string;
}

export interface LogtoError extends Error {
  successfulEmails: string[];
}

const BATCH_SIZE = 10;
const chunks = <T>(arr: T[], size: number): T[][] =>
  Array.from({ length: Math.ceil(arr.length / size) }, (_, i) =>
    arr.slice(i * size, i * size + size),
  );

export const createLogtoUsers = async (
  profiles: Pick<KnownProfileDataDetails, "email" | "firstName" | "lastName">[],
  config: EnvConfig,
  organizationId: string,
  profileImportId: string,
): Promise<LogtoUserResult[]> => {
  const client = new LogtoClient(
    config.LOGTO_MANAGEMENT_API_ENDPOINT,
    await getAccessToken({
      resource: config.LOGTO_MANAGEMENT_API_RESOURCE_URL,
      scopes: ["all"],
      applicationId: config.LOGTO_MANAGEMENT_API_CLIENT_ID,
      applicationSecret: config.LOGTO_MANAGEMENT_API_CLIENT_SECRET,
      logtoOidcEndpoint: config.LOGTO_OIDC_ENDPOINT,
    }),
  );

  const results = [];
  const errors = [];
  for (const batch of chunks(profiles, BATCH_SIZE)) {
    const batchPromises = batch.map(async (profile) => {
      try {
        const result = await client.createUser({
          primaryEmail: profile.email,
          username: [profile.firstName, profile.lastName]
            .join("_")
            .toLowerCase(),
          name: [profile.firstName, profile.lastName].join(" "),
          customData: {
            organizationId,
            profileImportId,
          },
        });
        return { success: true, result };
      } catch (error) {
        return { success: false, error, email: profile.email };
      }
    });

    const batchResults = await Promise.all(batchPromises);
    results.push(
      ...batchResults
        .filter((r) => r.success)
        .map((r) => r.result as LogtoUserResult),
    );
    errors.push(...batchResults.filter((r) => !r.success));

    // Add a small delay between batches to avoid rate limiting
    if (batch.length === BATCH_SIZE) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  if (errors.length > 0) {
    const error = new Error(
      "Some users failed to be created in Logto",
    ) as LogtoError;
    error.successfulEmails = results.map((r) => r.primaryEmail);
    throw error;
  }

  return results;
};

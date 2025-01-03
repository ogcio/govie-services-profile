import { getAccessToken } from "@ogcio/api-auth";
import type { FastifyInstance } from "fastify";
import { LogtoClient } from "~/clients/logto.js";
import type { ImportProfilesBody } from "~/schemas/profiles/import.js";

export const createLogtoUsers = async (
  profiles: Pick<ImportProfilesBody[0], "email" | "first_name" | "last_name">[],
  config: FastifyInstance["config"],
  organizationId: string,
  jobId: string,
) => {
  const client = new LogtoClient(
    config.LOGTO_MANAGEMENT_API_ENDPOINT,
    await getAccessToken({
      resource: "https://default.logto.app/api",
      scopes: ["all"],
      applicationId: config.LOGTO_MANAGEMENT_API_CLIENT_ID,
      applicationSecret: config.LOGTO_MANAGEMENT_API_CLIENT_SECRET,
      logtoOidcEndpoint: config.LOGTO_OIDC_ENDPOINT,
    }),
  );

  return Promise.all(
    profiles.map((profile) =>
      client.createUser({
        primaryEmail: profile.email,
        username: [profile.first_name, profile.last_name]
          .join("_")
          .toLowerCase(),
        name: [profile.first_name, profile.last_name].join(" "),
        customData: {
          organizationId,
          jobId,
        },
      }),
    ),
  );
};

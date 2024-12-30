import { getAccessToken } from "@ogcio/api-auth";
import type { FastifyInstance } from "fastify";
import type { ImportProfiles } from "~/types/profile.js";

export const createUsersOnLogto = async (
  profiles: Pick<ImportProfiles[0], "email" | "first_name" | "last_name">[],
  app: FastifyInstance,
  organizationId: string,
  jobId: string,
) => {
  const token = await getAccessToken({
    resource: "https://default.logto.app/api",
    scopes: ["all"],
    applicationId: app.config.LOGTO_MANAGEMENT_API_CLIENT_ID,
    applicationSecret: app.config.LOGTO_MANAGEMENT_API_CLIENT_SECRET,
    logtoOidcEndpoint: app.config.LOGTO_OIDC_ENDPOINT,
  });

  const basicOptions = {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: "",
  };
  const profilePromises: Promise<{
    id: string;
    email: string;
  }>[] = [];

  for (const profile of profiles) {
    const username = [profile.first_name, profile.last_name]
      .join("_")
      .toLowerCase();
    const body = {
      primaryEmail: profile.email,
      username,
      name: username.split("_").join(" "),
      customData: {
        organizationId,
        jobId,
      },
    };

    const url = [app.config.LOGTO_MANAGEMENT_API_ENDPOINT, "users"].join("/");
    profilePromises.push(
      createOnLogto(url, { ...basicOptions, body: JSON.stringify(body) }),
    );
  }

  return Promise.all(profilePromises);
};

// biome-ignore lint/suspicious/noExplicitAny: <explanation>
const createOnLogto = async (url: string, options: Record<string, any>) => {
  // TODO: add proper logging
  console.log("INVOKING LOGTO", url, options);
  const response = await fetch(url, options);
  const body = await response.json();
  // TODO: add proper logging
  console.log(" LOGTO RESPONE", body);
  return {
    id: body.id,
    email: body.primaryEmail,
  };
};

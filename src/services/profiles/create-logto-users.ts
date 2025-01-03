import { getAccessToken } from "@ogcio/api-auth";
import type { FastifyInstance } from "fastify";
import type { ImportProfilesBody } from "~/schemas/profiles/import.js";
import { withRetry } from "~/utils/with-retry.js";

export const createLogtoUsers = async (
  profiles: Pick<ImportProfilesBody[0], "email" | "first_name" | "last_name">[],
  config: FastifyInstance["config"],
  organizationId: string,
  jobId: string,
) => {
  const token = await getAccessToken({
    resource: "https://default.logto.app/api",
    scopes: ["all"],
    applicationId: config.LOGTO_MANAGEMENT_API_CLIENT_ID,
    applicationSecret: config.LOGTO_MANAGEMENT_API_CLIENT_SECRET,
    logtoOidcEndpoint: config.LOGTO_OIDC_ENDPOINT,
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
    id: string | null;
    email: string | null;
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

    const url = [config.LOGTO_MANAGEMENT_API_ENDPOINT, "users"].join("/");
    profilePromises.push(
      createLogtoUser(url, { ...basicOptions, body: JSON.stringify(body) }),
    );
  }

  return Promise.all(profilePromises);
};

const createLogtoUser = async (
  url: string,
  options: Record<string, string | number | Record<string, string>>,
) => {
  return withRetry(async (signal) => {
    const response = await fetch(url, {
      ...options,
      signal,
    });

    if (!response.ok) {
      throw new Error(`Logto communication error! Status: ${response.status}`);
    }

    const body = await response.json();
    return {
      id: body.id,
      email: body.primaryEmail,
    };
  });
};

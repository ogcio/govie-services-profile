import { getAccessToken } from "@ogcio/api-auth";
import type { FastifyInstance } from "fastify";
import type { ImportProfiles } from "~/types/profile.js";

export const createUsersOnLogto = async (
  profiles: Pick<ImportProfiles[0], "email" | "first_name" | "last_name">[],
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
    error: Error | null;
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
      createOnLogto(url, { ...basicOptions, body: JSON.stringify(body) }),
    );
  }

  return Promise.all(profilePromises);
};

const MAX_RETRIES = 3;
const INITIAL_DELAY = 1000;

// biome-ignore lint/suspicious/noExplicitAny: <explanation>
const createOnLogto = async (url: string, options: Record<string, any>) => {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(
          `Logto communication error! Status: ${response.status}`,
        );
      }

      const body = await response.json();

      return {
        error: null,
        id: body.id,
        email: body.primaryEmail,
      };
    } catch (error) {
      lastError = error as Error;
      // Skip delay on last attempt
      if (attempt < MAX_RETRIES - 1) {
        await new Promise((resolve) =>
          setTimeout(resolve, INITIAL_DELAY * 2 ** attempt),
        );
      }
    }
  }

  console.error("Failed to create user on Logto after retries:", lastError);
  return {
    error: lastError,
    id: null,
    email: null,
  };
};

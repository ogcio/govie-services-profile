import { MY_GOV_ID_IDENTITY } from "~/const/index.js";
import { getCurrentUTCDate } from "~/utils/index.js";

export type WebhookUser = {
  id: string;
  details?: {
    firstName: string;
    lastName: string;
    email: string;
  };
  email: string;
  primaryUserId: string;
  createdAt: string;
  organizationId?: string | null;
  jobId?: string | null;
};

export const webhookBodyToUser = (bodyData: {
  identities: Record<
    string,
    {
      details: {
        email?: string | null;
        rawData: Record<string, string | number | boolean | null>;
      };
    }
  >;
  id: string;
  customData?: { organizationId?: string | null; jobId?: string | null };
  primaryEmail: string;
}): WebhookUser => {
  // From MyGovid
  if (bodyData.identities[MY_GOV_ID_IDENTITY]) {
    const identity = bodyData.identities[MY_GOV_ID_IDENTITY].details;

    return {
      id: bodyData.id as string,
      details: {
        firstName: (identity.rawData.firstName ??
          identity.rawData.givenName) as string,
        lastName: (identity.rawData.lastName ??
          identity.rawData.surname) as string,
        email: (identity.email ?? bodyData.primaryEmail) as string,
      },
      email: (identity.email ?? bodyData.primaryEmail) as string,
      primaryUserId: bodyData.id,
      createdAt: getCurrentUTCDate(),
    };
  }

  return {
    id: bodyData.id as string,
    email: bodyData.primaryEmail,
    primaryUserId: bodyData.id,
    createdAt: getCurrentUTCDate(),
    organizationId: bodyData.customData?.organizationId,
    jobId: bodyData.customData?.jobId,
  };
};

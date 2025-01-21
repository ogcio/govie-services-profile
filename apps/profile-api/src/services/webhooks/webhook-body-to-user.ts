import { MY_GOV_ID_IDENTITY } from "~/const/index.js";
import { getCurrentUTCDate } from "~/utils/index.js";

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
}) => {
  // From MyGovid
  if (bodyData.identities[MY_GOV_ID_IDENTITY]) {
    const identity = bodyData.identities[MY_GOV_ID_IDENTITY].details;

    return {
      id: bodyData.id as string,
      details: {
        firstName: identity.rawData.firstName ?? identity.rawData.givenName,
        lastName: identity.rawData.lastName ?? identity.rawData.surname,
        email: identity.email,
      },
      email: identity.email,
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

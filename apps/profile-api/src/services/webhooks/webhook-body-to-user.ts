import { MY_GOV_ID_IDENTITY } from "~/const/logto.js";
import { getCurrentUTCDate } from "~/utils/get-current-utc-date.js";

export const webhookBodyToUser = (bodyData: {
  identities: Record<
    string,
    { details: { email: string; rawData: Record<string, string> } }
  >;
  id: string;
  customData?: { organizationId: string; jobId: string };
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

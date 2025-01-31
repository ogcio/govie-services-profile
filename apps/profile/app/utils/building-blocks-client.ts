import {
  getBuildingBlockSDK,
} from "@ogcio/building-blocks-sdk";
import { headers } from "next/headers";

export const getSDKs = () => getBuildingBlockSDK({
  services: {
    profile: { baseUrl: process.env.PROFILE_BACKEND_URL ?? "" },
  },
  getTokenFn: async (serviceName: string) => {
    if (serviceName === "profile") {
      return invokeTokenApi();
    }

    throw new Error(`Not valid service ${serviceName}`);
  },
});

const invokeTokenApi = async (): Promise<string> => {
  // call a route handler that retrieves the cached token
  // we need to forward the cookie header or the request won't be authenticated
  const cookieHeader = headers().get("cookie") as string;

  const res = await fetch(
    new URL(
      "/api/token",
      process.env.NEXT_PUBLIC_PROFILE_SERVICE_ENTRY_POINT as string,
    ),
    { headers: { cookie: cookieHeader } },
  );
  const { token } = await res.json();
  return token;
};

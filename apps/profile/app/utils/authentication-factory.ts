import { BaseAuthenticationContext } from "@ogcio/nextjs-auth/base-authentication-context";
import { getAuthenticationContextConfig, logtoParams } from "./logto-config";
import { getSDKs } from "./building-blocks-client";

export class AuthenticationFactory {
  static getInstance(): BaseAuthenticationContext {
    return new BaseAuthenticationContext(getAuthenticationContextConfig(), logtoParams);
  }

  static async getProfileClient() {
    return getSDKs().profile;
  }
}

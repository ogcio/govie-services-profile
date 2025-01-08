import apiAuthPlugin from "@ogcio/api-auth";
import type { FastifyInstance } from "fastify";

export const autoConfig = (fastify: FastifyInstance) => {
  return {
    jwkEndpoint: fastify.config.LOGTO_JWK_ENDPOINT,
    oidcEndpoint: fastify.config.LOGTO_OIDC_ENDPOINT,
    // Used to be the audience value to check into the token, but we are not using it
    // It was supposed to be used here https://docs.logto.io/authorization/api-resources/node-express
    // currentApiResourceIndicator: fastify.config.LOGTO_CURRENT_API_RESOURCE_INDICATOR as string,
  };
};

export default apiAuthPlugin;

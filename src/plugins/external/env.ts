import env from "@fastify/env";

declare module "fastify" {
  export interface FastifyInstance {
    config: {
      PORT: number;
      FASTIFY_CLOSE_GRACE_DELAY: number;
      LOG_LEVEL: string;
      POSTGRES_USER: string;
      POSTGRES_PASSWORD: string;
      POSTGRES_HOST: string;
      POSTGRES_PORT: number;
      POSTGRES_DB_NAME: string;
      LOGTO_JWK_ENDPOINT: string;
      LOGTO_OIDC_ENDPOINT: string;
      LOGTO_WEBHOOK_SIGNING_KEY: string;
    };
  }
}

const schema = {
  type: "object",
  required: [
    "PORT",
    "POSTGRES_USER",
    "POSTGRES_PASSWORD",
    "POSTGRES_HOST",
    "POSTGRES_PORT",
    "POSTGRES_DB_NAME",
    "LOGTO_JWK_ENDPOINT",
    "LOGTO_OIDC_ENDPOINT",
    "LOGTO_WEBHOOK_SIGNING_KEY",
  ],
  properties: {
    PORT: { type: "number" },
    FASTIFY_CLOSE_GRACE_DELAY: { type: "number", default: 500 },
    LOG_LEVEL: { type: "string", default: "debug" },
    POSTGRES_USER: { type: "string" },
    POSTGRES_PASSWORD: { type: "string" },
    POSTGRES_HOST: { type: "string" },
    POSTGRES_PORT: { type: "number" },
    POSTGRES_DB_NAME: { type: "string" },
    LOGTO_JWK_ENDPOINT: { type: "string" },
    LOGTO_OIDC_ENDPOINT: { type: "string" },
    LOGTO_WEBHOOK_SIGNING_KEY: { type: "string" },
  },
};

export const autoConfig = {
  schema,
  dotenv: true,
};

export default env;

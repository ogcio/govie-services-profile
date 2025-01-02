import env from "@fastify/env";

interface EnvDbConfig {
  POSTGRES_USER: string;
  POSTGRES_PASSWORD: string;
  POSTGRES_HOST: string;
  POSTGRES_PORT: number;
  POSTGRES_DATABASE: string;
}

interface EnvConfig extends EnvDbConfig {
  PORT: number;
  FASTIFY_CLOSE_GRACE_DELAY: number;
  LOG_LEVEL: string;
  LOGTO_JWK_ENDPOINT: string;
  LOGTO_OIDC_ENDPOINT: string;
  LOGTO_WEBHOOK_SIGNING_KEY: string;
  LOGTO_MANAGEMENT_API_CLIENT_ID: string;
  LOGTO_MANAGEMENT_API_CLIENT_SECRET: string;
  LOGTO_MANAGEMENT_API_ENDPOINT: string;
}

declare module "fastify" {
  export interface FastifyInstance {
    config: EnvConfig;
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
    "POSTGRES_DATABASE",
    "LOGTO_JWK_ENDPOINT",
    "LOGTO_OIDC_ENDPOINT",
    "LOGTO_WEBHOOK_SIGNING_KEY",
    "LOGTO_MANAGEMENT_API_CLIENT_ID",
    "LOGTO_MANAGEMENT_API_CLIENT_SECRET",
    "LOGTO_MANAGEMENT_API_ENDPOINT",
  ],
  properties: {
    PORT: { type: "number" },
    FASTIFY_CLOSE_GRACE_DELAY: { type: "number", default: 500 },
    LOG_LEVEL: { type: "string", default: "debug" },
    POSTGRES_USER: { type: "string" },
    POSTGRES_PASSWORD: { type: "string" },
    POSTGRES_HOST: { type: "string" },
    POSTGRES_PORT: { type: "number" },
    POSTGRES_DATABASE: { type: "string" },
    LOGTO_JWK_ENDPOINT: { type: "string" },
    LOGTO_OIDC_ENDPOINT: { type: "string" },
    LOGTO_WEBHOOK_SIGNING_KEY: { type: "string" },
    LOGTO_MANAGEMENT_API_CLIENT_ID: { type: "string" },
    LOGTO_MANAGEMENT_API_CLIENT_SECRET: { type: "string" },
    LOGTO_MANAGEMENT_API_ENDPOINT: { type: "string" },
  },
};

export const autoConfig = {
  schema,
  dotenv: true,
};

export default env;
export type { EnvConfig, EnvDbConfig };

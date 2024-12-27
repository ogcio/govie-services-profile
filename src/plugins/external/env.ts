import env from "@fastify/env";

declare module "fastify" {
  export interface FastifyInstance {
    config: {
      PORT: number;
      FASTIFY_CLOSE_GRACE_DELAY: number;
      LOG_LEVEL: string;
    };
  }
}

const schema = {
  type: "object",
  required: ["PORT"],
  properties: {
    PORT: { type: "number" },
    FASTIFY_CLOSE_GRACE_DELAY: { type: "number", default: 500 },
    LOG_LEVEL: { type: "string", default: "debug" },
  },
};

export const autoConfig = {
  schema,
  dotenv: true,
};

export default env;

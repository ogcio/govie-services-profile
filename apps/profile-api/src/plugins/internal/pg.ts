import postgres from "@fastify/postgres";
import type { FastifyInstance, FastifyPluginAsync } from "fastify";
import fp from "fastify-plugin";

export default fp(
  async (fastify: FastifyInstance, opts: FastifyPluginAsync) => {
    await fastify.register(postgres, {
      host: fastify.config.POSTGRES_HOST,
      port: fastify.config.POSTGRES_PORT,
      user: fastify.config.POSTGRES_USER,
      password: fastify.config.POSTGRES_PASSWORD,
      database: fastify.config.POSTGRES_DATABASE,
      ...opts,
    });
  },
  { name: "pg" },
);

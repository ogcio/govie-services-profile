import pg from "@fastify/postgres";
import type { FastifyInstance } from "fastify";

export const autoConfig = (fastify: FastifyInstance) => {
  if (process.env.DATABASE_TEST_URL) {
    return { connectionString: process.env.DATABASE_TEST_URL };
  }

  return {
    host: fastify.config.POSTGRES_HOST,
    port: fastify.config.POSTGRES_PORT,
    user: fastify.config.POSTGRES_USER,
    password: fastify.config.POSTGRES_PASSWORD,
    database: fastify.config.POSTGRES_DATABASE,
  };
};

export default pg;

import pg from "@fastify/postgres";
import type { FastifyInstance } from "fastify";

export const autoConfig = (fastify: FastifyInstance) => {
  return {
    host: fastify.config.POSTGRES_HOST,
    port: fastify.config.POSTGRES_PORT,
    user: fastify.config.POSTGRES_USER,
    password: fastify.config.POSTGRES_PASSWORD,
    database: fastify.config.POSTGRES_DB_NAME,
  };
};

export default pg;

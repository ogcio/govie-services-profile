import { join } from "path";
import fastifyAutoload from "@fastify/autoload";
import { initializeErrorHandler } from "@ogcio/fastify-error-handler";
import { initializeLoggingHooks } from "@ogcio/fastify-logging-wrapper";
import type { FastifyInstance, FastifyPluginOptions } from "fastify";

export default async function buildServer(
  server: FastifyInstance,
  options: FastifyPluginOptions,
) {
  initializeLoggingHooks(server);
  initializeErrorHandler(server);

  server.decorate("dirname", import.meta.dirname);

  await server.register(fastifyAutoload, {
    dir: join(import.meta.dirname, "plugins/external"),
    options: { ...options },
  });

  server.register(fastifyAutoload, {
    dir: join(import.meta.dirname, "routes"),
    autoHooks: true,
    cascadeHooks: true,
    // ignore the files that starts with shared or utils
    ignorePattern: /.*(shared|utils)\-?(.+)?\.(t|j)s$/,
    options: { ...options },
  });
}

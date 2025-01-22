import type { TypeBoxTypeProvider } from "@fastify/type-provider-typebox";
import { getLoggingConfiguration } from "@ogcio/fastify-logging-wrapper";
import closeWithGrace from "close-with-grace";
import fastify, { type FastifyInstance } from "fastify";
import fp from "fastify-plugin";
import { writeFile } from "fs/promises";
import buildServer from "./server.js";

const writeOpenApiDefinition = async (app: FastifyInstance) => {
  try {
    await writeFile("./openapi-definition.yml", app.swagger({ yaml: true }));
  } catch (e) {
    app.log.warn(e, "Error writing open api definition file");
  }
};

export async function initializeServer() {
  const server = fastify({
    ...getLoggingConfiguration({
      additionalLoggerConfigs: { level: process.env.LOG_LEVEL ?? "debug" },
    }),
    ajv: {
      customOptions: {
        coerceTypes: false,
        removeAdditional: "all",
      },
    },
  }).withTypeProvider<TypeBoxTypeProvider>();

  server.register(fp(buildServer));
  await server.ready();
  server.swagger();
  await writeOpenApiDefinition(server);

  closeWithGrace(
    { delay: server.config.FASTIFY_CLOSE_GRACE_DELAY },
    async ({ err }) => {
      if (err != null) {
        server.log.error(err);
      }

      await server.close();
    },
  );

  return server;
}

async function init() {
  const server = await initializeServer();

  try {
    await server.listen({
      port: server.config.PORT,
      host: "0.0.0.0",
    });
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
}

init();

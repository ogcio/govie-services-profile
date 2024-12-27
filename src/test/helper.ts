import path from "node:path";
import type { FastifyInstance } from "fastify";
import { build as buildApplication } from "fastify-cli/helper.js";

declare module "fastify" {
  interface FastifyInstance {}
}

const AppPath = path.join(import.meta.dirname, "../server.ts");

export function config() {
  return {
    skipOverride: "true",
  };
}

// automatically build and tear down our instance
export async function build() {
  // you can set all the options supported by the fastify CLI command
  const argv = [AppPath];

  // fastify-plugin ensures that all decorators
  // are exposed for testing purposes, this is
  // different from the production setup
  const app = (await buildApplication(argv, config(), {})) as FastifyInstance;

  return app;
}

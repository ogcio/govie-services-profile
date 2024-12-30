import type { FastifyInstance } from "fastify";
import profiles from "./profiles/index.js";

export default async function routes(app: FastifyInstance) {
  app.register(profiles, { prefix: "/profiles" });
}

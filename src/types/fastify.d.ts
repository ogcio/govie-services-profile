// biome-ignore lint/correctness/noUnusedImports: Needed to make fastify able to merge all
import { FastifyReply, FastifyRequest } from "fastify";

declare module "fastify" {
  export interface FastifyInstance {
    dirname: string;
  }
}

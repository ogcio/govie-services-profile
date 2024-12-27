import type { FastifyPluginAsyncTypebox } from "@fastify/type-provider-typebox";
import type { FastifyInstance } from "fastify";
import { getPackageInfo } from "../utils/get-package-info.js";
import type {
  FastifyReplyTypebox,
  FastifyRequestTypebox,
} from "./shared-routes.js";

const healthCheckSchema = {
  tags: ["Health"],
  description:
    "It checks the current health status of the APIs, pinging all the related items",
};

const plugin: FastifyPluginAsyncTypebox = async function healthCheck(
  app: FastifyInstance,
) {
  app.get(
    "/health",
    {
      schema: healthCheckSchema,
    },
    async (
      _request: FastifyRequestTypebox<typeof healthCheckSchema>,
      _reply: FastifyReplyTypebox<typeof healthCheckSchema>,
    ) => {
      const { name, version } = await getPackageInfo();
      return { [name]: version };
    },
  );
};

export default plugin;

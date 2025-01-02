import type { FastifyPluginAsyncTypebox } from "@fastify/type-provider-typebox";
import type { FastifyInstance } from "fastify";
import type {
  FastifyReplyTypebox,
  FastifyRequestTypebox,
} from "~/schemas/shared-routes.js";
import { getPackageInfo } from "~/utils/get-package-info.js";

// This makes the healthcheck not prefixed with default prefix
// then the endpoint will be /health, without /api/v1/
export const prefixOverride = "";

const healthCheckSchema = {
  tags: ["Health"],
  hide: true,
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

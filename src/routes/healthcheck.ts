import type { FastifyPluginAsyncTypebox } from "@fastify/type-provider-typebox";
import type { FastifyInstance } from "fastify";
import { healthCheckSchema } from "~/schemas/healthcheck.js";
import type {
  FastifyReplyTypebox,
  FastifyRequestTypebox,
} from "~/schemas/shared.js";
import { getPackageInfo } from "~/utils/get-package-info.js";

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

// This makes the healthcheck not prefixed with default prefix
// then the endpoint will be /health, without /api/v1/
export const prefixOverride = "";

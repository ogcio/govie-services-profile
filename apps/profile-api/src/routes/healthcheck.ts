import type { FastifyPluginAsyncTypebox } from "@fastify/type-provider-typebox";
import type { FastifyInstance } from "fastify";
import { HealthCheckSchema } from "~/schemas/healthcheck.js";
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
      schema: HealthCheckSchema,
    },
    async (
      _request: FastifyRequestTypebox<typeof HealthCheckSchema>,
      _reply: FastifyReplyTypebox<typeof HealthCheckSchema>,
    ) => {
      const { name, version } = await getPackageInfo();
      return { [name]: version };
    },
  );
};

export default plugin;
export const prefixOverride = "";

import type { FastifyInstance, FastifyPluginAsync } from "fastify";
import fp from "fastify-plugin";
import { getAnalyticsSdk } from "../../utils/authentication-factory.js";

const operationIdToNotTrack: Record<string, boolean> = { healthcheck: true };

export default fp(
  async (server: FastifyInstance, _opts: FastifyPluginAsync) => {
    server.addHook("onRequest", async (request) => {
      const operationId = request.routeOptions.schema?.operationId;

      if (operationId && !operationIdToNotTrack[operationId]) {
        const sdk = await getAnalyticsSdk(request.log);
        sdk.track.event({
          event: {
            action: request.method.toUpperCase(),
            category: "API",
            name: operationId,
            value: 1,
          },
        });
      }
    });
  },
);

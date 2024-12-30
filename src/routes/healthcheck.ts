import { httpErrors } from "@fastify/sensible";
import { getErrorMessage } from "@ogcio/shared-errors";
import type { FastifyInstance } from "fastify";
import { isHttpError } from "http-errors";
import { getPackageInfo } from "~/utils/get-package-info.js";

export default async function healthCheck(app: FastifyInstance) {
  app.get(
    "/health",
    {
      schema: {
        tags: ["Health"],
        hide: true,
        description:
          "It checks the current health status of the APIs, pinging all the related items",
      },
    },
    async () => {
      await checkDb(app);
      const version = await getPackageInfo();
      return { "profile-api": version };
    },
  );
}

const checkDb = async (app: FastifyInstance): Promise<void> => {
  const pool = await app.pg.connect();
  try {
    const res = await app.pg.query('SELECT 1 as "column"');
    if (res.rowCount !== 1) {
      throw httpErrors.internalServerError(
        `Expected 1 record, got ${res.rowCount}`,
      );
    }
  } catch (e) {
    if (isHttpError(e)) {
      throw e;
    }

    throw httpErrors.internalServerError(getErrorMessage(e));
  } finally {
    pool.release();
  }
};

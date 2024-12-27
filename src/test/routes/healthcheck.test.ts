import type { FastifyInstance } from "fastify";
import { assert, afterEach, describe, test } from "vitest";
import { build } from "../helper.js";

describe("Healthcheck works as expected", {}, () => {
  let app: FastifyInstance | undefined;

  afterEach(() => {
    if (app) {
      app.close();
    }
  });

  test("GET /", async () => {
    const app = await build();
    const res = await app.inject({
      url: "/health",
    });

    assert.deepStrictEqual(200, res.statusCode);
  });
});

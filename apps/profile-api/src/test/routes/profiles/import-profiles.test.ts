import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { build } from "../../test-server-builder.js";

describe("POST /api/v1/profiles/import-profiles", () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await build();
    app.addHook("onRequest", async (req: FastifyRequest) => {
      // Override the request decorator
      app.checkPermissions = async (
        request: FastifyRequest,
        _reply: FastifyReply,
        _permissions: string[],
        _matchConfig?: { method: "AND" | "OR" },
      ) => {
        req.userData = {
          userId: "userId",
          accessToken: "accessToken",
          organizationId: "organisationId",
          isM2MApplication: false,
        };

        request.userData = req.userData;
      };
    });
  });

  afterAll(async () => {
    await app.close();
  });

  describe("Input validation", () => {
    it("should reject empty profiles array", async () => {
      const response = await app.inject({
        method: "POST",
        url: "/api/v1/profiles/import-profiles",
        payload: {
          profiles: [],
        },
        headers: {
          "content-type": "application/json",
        },
      });

      expect(response.statusCode).toBe(422);
    });

    it("should reject profiles with missing required fields", async () => {
      const response = await app.inject({
        method: "POST",
        url: "/api/v1/profiles/import-profiles",
        payload: {
          profiles: [
            {
              firstName: "John",
              // Missing other required fields
            },
          ],
        },
        headers: {
          "content-type": "application/json",
        },
      });

      expect(response.statusCode).toBe(422);
    });

    it("should reject profiles with invalid email format", async () => {
      const response = await app.inject({
        method: "POST",
        url: "/api/v1/profiles/import-profiles",
        payload: {
          profiles: [
            {
              firstName: "John",
              lastName: "Doe",
              email: "invalid-email",
              phone: "1234567890",
              dateOfBirth: "1990-01-01",
              address: "123 Test St",
              city: "Test City",
            },
          ],
        },
        headers: {
          "content-type": "application/json",
        },
      });

      expect(response.statusCode).toBe(422);
    });

    it("should reject profiles with invalid date format", async () => {
      const response = await app.inject({
        method: "POST",
        url: "/api/v1/profiles/import-profiles",
        payload: {
          profiles: [
            {
              firstName: "John",
              lastName: "Doe",
              email: "john@example.com",
              phone: "1234567890",
              dateOfBirth: "invalid-date",
              address: "123 Test St",
              city: "Test City",
            },
          ],
        },
        headers: {
          "content-type": "application/json",
        },
      });

      expect(response.statusCode).toBe(422);
    });

    it("should reject invalid file type for CSV upload", async () => {
      const form = new FormData();
      const file = new File(["test"], "test.txt", { type: "text/plain" });
      form.append("file", file);

      const boundary = "----formdata-boundary";
      const response = await app.inject({
        method: "POST",
        url: "/api/v1/profiles/import-profiles",
        payload: form,
        headers: {
          "content-type": `multipart/form-data; boundary=${boundary}`,
        },
      });

      expect(response.statusCode).toBe(422);
    });
  });
});

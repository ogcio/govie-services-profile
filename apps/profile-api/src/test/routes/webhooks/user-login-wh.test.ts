import { createHmac } from "node:crypto";
import type { FastifyInstance } from "fastify";
import { afterEach, beforeEach, describe, expect, it, suite, vi } from "vitest";
import { processUserWebhook } from "../../../services/webhooks/users.js";
import { build } from "../../test-server-builder.js";
import {
  type ToTestHttpMethods,
  ensureHttpMethodsDontExist,
} from "../shared-routes-test.js";

// Mock processUserWebhook
vi.mock("~/services/webhooks/users.js", () => ({
  processUserWebhook: vi.fn().mockResolvedValue({ id: "profile-123" }),
}));

const endpoint = "/user-login-wh";
const mustNotExistMethods: ToTestHttpMethods[] = [
  "DELETE",
  "OPTIONS",
  "GET",
  "PUT",
  "PATCH",
];

describe("/user-login-wh", {}, () => {
  let app: FastifyInstance;
  const validWebhookBody = {
    hookId: "hook-123",
    event: "User.Created",
    sessionId: "session-123",
    userAgent: "test-agent",
    ip: "127.0.0.1",
    path: "/test",
    method: "POST",
    status: 200,
    createdAt: new Date().toISOString(),
    data: {
      id: "user-123",
      username: "testuser",
      primaryEmail: "test@example.com",
      primaryPhone: null,
      name: "Test User",
      avatar: null,
      customData: {
        jobId: "job-123",
        organizationId: "org-123",
      },
      identities: {
        "MyGovId (MyGovId connector)": {
          details: {
            email: "test@example.com",
            rawData: {
              firstName: "Test",
              lastName: "User",
            },
          },
        },
      },
      lastSignInAt: null,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      profile: {},
      applicationId: null,
      isSuspended: false,
      hasPassword: false,
    },
  };

  const generateSignature = (payload: Buffer, secret: string) => {
    const hmac = createHmac("sha256", secret);
    hmac.update(payload);
    return hmac.digest("hex");
  };

  beforeEach(async () => {
    app = await build();
  });

  afterEach(async () => {
    await app.close();
    vi.clearAllMocks();
  });

  suite("Unexpected HTTP methods throw 404", async () => {
    const app = await build();

    ensureHttpMethodsDontExist(app, endpoint, mustNotExistMethods);
  });

  it("should process valid webhook with correct signature", async () => {
    // Ensure test config has signing key
    expect(app.config.LOGTO_WEBHOOK_SIGNING_KEY).toBeDefined();
    const signingKey = app.config.LOGTO_WEBHOOK_SIGNING_KEY;

    // Stringify payload consistently
    const payloadString = JSON.stringify(validWebhookBody);

    // Generate signature matching Logto's format
    const signature = createHmac("sha256", signingKey)
      .update(payloadString)
      .digest("hex");

    const response = await app.inject({
      method: "POST",
      url: endpoint,
      payload: payloadString,
      headers: {
        "content-type": "application/json",
        "logto-signature-sha-256": signature,
      },
    });

    expect(response.statusCode).toBe(200);
  });

  it("should reject invalid signature", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/user-login-wh",
      headers: {
        "content-type": "application/json",
        "logto-signature-sha-256": "invalid-signature",
      },
      payload: validWebhookBody,
    });

    expect(response.statusCode).toBe(401);
    expect(processUserWebhook).not.toHaveBeenCalled();
  });

  it("should reject missing signature header", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/user-login-wh",
      headers: {
        "content-type": "application/json",
      },
      payload: validWebhookBody,
    });

    expect(response.statusCode).toBe(401);
    expect(processUserWebhook).not.toHaveBeenCalled();
  });

  it("should handle invalid webhook body", async () => {
    const payload = Buffer.from(JSON.stringify({ invalid: "body" }));
    const signature = generateSignature(
      payload,
      app.config.LOGTO_WEBHOOK_SIGNING_KEY,
    );

    const response = await app.inject({
      method: "POST",
      url: "/user-login-wh",
      headers: {
        "content-type": "application/json",
        "logto-signature-sha-256": signature,
      },
      payload: { invalid: "body" },
    });

    expect(response.statusCode).toBe(422);
    expect(processUserWebhook).not.toHaveBeenCalled();
  });
});

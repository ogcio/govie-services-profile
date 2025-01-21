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

  const directSigninBody = {
    ip: "100.64.0.214",
    data: {
      id: "c2uyjunodb03",
      name: "Tony Stark",
      avatar: null,
      profile: {},
      username: null,
      createdAt: 1731395910235,
      updatedAt: 1737461333587,
      customData: {},
      identities: {
        "MyGovId (MyGovId connector)": {
          userId: "7ffe40ff7d558de01c54",
          details: {
            id: "7ffe40ff7d558de01c54",
            name: "Tony Stark",
            email: "tony.stark@gov.ie",
            phone: "+3535256052082",
            rawData: {
              aud: "mock_client_id",
              exp: 1731403109,
              iat: 1731395909,
              iss: "https://mygovid-mock.dev.blocks.gov.ie",
              nbf: 1716804749,
              oid: "71848ec91433bc4222d0",
              sub: "7ffe40ff7d558de01c54",
              ver: "1.0",
              email: "tony.stark@gov.ie",
              mobile: "+3535256052082",
              surname: "Stark",
              lastName: "Stark",
              BirthDate: "13/06/1941",
              auth_time: 1731395909171,
              firstName: "Tony",
              givenName: "Tony",
              CustomerId: "532",
              LastJourney: "Login",
              AlternateIds: "",
              CorrelationId: "38c7bbd78acbb8e57fa28ded7147e017ebd3e18a",
              SMS2FAEnabled: false,
              DSPOnlineLevel: "0",
              currentCulture: "en",
              PublicServiceNumber: "0111019P",
              AcceptedPrivacyTerms: true,
              DSPOnlineLevelStatic: "0",
              trustFrameworkPolicy: "B2C_1A_MyGovID_signin-v5-PARTIAL2",
              AcceptedPrivacyTermsDateTime: 1715582120,
              AcceptedPrivacyTermsVersionNumber: "7",
            },
          },
        },
      },
      isSuspended: false,
      lastSignInAt: 1737461333586,
      primaryEmail: "tony.stark@gov.ie",
      primaryPhone: "+3535256052082",
      applicationId: "0921d8onfb9f3bv75trgf",
    },
    event: "User.Data.Updated",
    hookId: "login-webhook",
    createdAt: "2025-01-21T12:08:53.599Z",
    sessionId: "B8J8FuBsBXI6ZLoHhfkyi",
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36 Edg/131.0.0.0",
    application: {
      id: "1lvmteh2ao3xrswyq7j3e",
      name: "Messaging Building Block",
      type: "Traditional",
      description: "Messaging App of Life Events",
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

  it("should accept direct-signin webhook body", async () => {
    // This body is the one that logto is sending
    // when the user sign in directly without being
    // created by the profile api "import invokation"
    const payload = Buffer.from(JSON.stringify(directSigninBody));
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
      payload: directSigninBody,
    });

    expect(response.statusCode).toBe(200);
  });
});

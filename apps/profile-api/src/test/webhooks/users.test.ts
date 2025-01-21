import type { Pool } from "pg";
import { type Mock, beforeEach, describe, expect, it, vi } from "vitest";
import { processUserCreatedOrUpdatedWebhook } from "../../services/webhooks/process-user-created-updated-webhook.js";
import { processUserWebhook } from "../../services/webhooks/users.js";
import { mockLogger, mockWebhookBodies } from "../fixtures/common.js";

// Mock the imported function
vi.mock(
  "../../services/webhooks/process-user-created-updated-webhook.js",
  () => ({
    processUserCreatedOrUpdatedWebhook: vi.fn(),
  }),
);

describe("processUserWebhook", () => {
  const mockPool = {} as Pool;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should process User.Created event", async () => {
    (processUserCreatedOrUpdatedWebhook as Mock).mockResolvedValue({
      id: "profile-123",
      status: "success",
    });

    const result = await processUserWebhook({
      body: mockWebhookBodies.userCreated,
      pool: mockPool,
      logger: mockLogger,
    });

    expect(result).toEqual({
      id: "profile-123",
      status: "success",
    });
  });

  it("should process User.Data.Updated event", async () => {
    (processUserCreatedOrUpdatedWebhook as Mock).mockResolvedValue({
      id: "profile-123",
      status: "success",
    });

    const result = await processUserWebhook({
      body: mockWebhookBodies.userUpdated,
      pool: mockPool,
      logger: mockLogger,
    });

    expect(result).toEqual({
      id: "profile-123",
      status: "success",
    });
  });

  it("should throw error for unimplemented events", async () => {
    const webhookBody = {
      event: "User.Deleted",
      data: {
        id: "user-123",
      },
    };

    await expect(
      processUserWebhook({
        body: webhookBody,
        pool: mockPool,
        logger: mockLogger,
      }),
    ).rejects.toThrow("This event, User.Deleted, is not managed yet");
  });
});

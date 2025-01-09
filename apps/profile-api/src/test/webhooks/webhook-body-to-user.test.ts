import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MY_GOV_ID_IDENTITY } from "../../const/logto.js";
import { webhookBodyToUser } from "../../services/webhooks/webhook-body-to-user.js";

describe("webhookBodyToUser", () => {
  const mockDate = "2024-01-01T00:00:00.000Z";

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(mockDate));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should handle MyGovID identity data", () => {
    const webhookBody = {
      id: "user-123",
      primaryEmail: "test@example.com",
      identities: {
        [MY_GOV_ID_IDENTITY]: {
          details: {
            email: "john@example.com",
            rawData: {
              firstName: "John",
              lastName: "Doe",
            },
          },
        },
      },
      customData: {
        organizationId: "org-123",
        jobId: "job-123",
      },
    };

    const result = webhookBodyToUser(webhookBody);

    expect(result).toEqual({
      id: "user-123",
      details: {
        firstName: "John",
        lastName: "Doe",
        email: "john@example.com",
      },
      email: "john@example.com",
      primaryUserId: "user-123",
      createdAt: mockDate,
    });
  });

  it("should handle MyGovID identity with givenName/surname", () => {
    const webhookBody = {
      id: "user-123",
      primaryEmail: "test@example.com",
      identities: {
        [MY_GOV_ID_IDENTITY]: {
          details: {
            email: "john@example.com",
            rawData: {
              givenName: "John",
              surname: "Doe",
            },
          },
        },
      },
    };

    const result = webhookBodyToUser(webhookBody);

    expect(result.details).toEqual({
      firstName: "John",
      lastName: "Doe",
      email: "john@example.com",
    });
  });

  it("should handle non-MyGovID data", () => {
    const webhookBody = {
      id: "user-123",
      primaryEmail: "john@example.com",
      identities: {},
      customData: {
        organizationId: "org-123",
        jobId: "job-123",
      },
    };

    const result = webhookBodyToUser(webhookBody);

    expect(result).toEqual({
      id: "user-123",
      email: "john@example.com",
      primaryUserId: "user-123",
      createdAt: mockDate,
      organizationId: "org-123",
      jobId: "job-123",
    });
  });

  it("should handle missing customData", () => {
    const webhookBody = {
      id: "user-123",
      primaryEmail: "john@example.com",
      identities: {},
    };

    const result = webhookBodyToUser(webhookBody);

    expect(result.organizationId).toBeUndefined();
    expect(result.jobId).toBeUndefined();
  });
});

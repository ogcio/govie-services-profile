import { getAccessToken } from "@ogcio/api-auth";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LogtoClient } from "../../clients/logto.js";
import { createLogtoUsers } from "../../services/profiles/create-logto-users.js";

// Mock dependencies
vi.mock("@ogcio/api-auth", () => ({
  getAccessToken: vi.fn().mockResolvedValue("mock-token"),
}));

vi.mock("../../../clients/logto.js", () => ({
  LogtoClient: vi.fn().mockImplementation(() => ({
    createUser: vi.fn(),
  })),
}));

describe("createLogtoUsers", () => {
  const mockConfig = {
    LOGTO_MANAGEMENT_API_ENDPOINT: "http://logto-api",
    LOGTO_MANAGEMENT_API_RESOURCE_URL: "http://logto-resource",
    LOGTO_MANAGEMENT_API_CLIENT_ID: "client-123",
    LOGTO_MANAGEMENT_API_CLIENT_SECRET: "secret-123",
    LOGTO_OIDC_ENDPOINT: "http://logto-oidc",
  };

  const sampleProfiles = [
    {
      email: "john@example.com",
      first_name: "John",
      last_name: "Doe",
    },
    {
      email: "jane@example.com",
      first_name: "Jane",
      last_name: "Smith",
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should create users in Logto successfully", async () => {
    const mockCreateUser = vi
      .fn()
      .mockResolvedValueOnce({ id: "user-1", primaryEmail: "john@example.com" })
      .mockResolvedValueOnce({
        id: "user-2",
        primaryEmail: "jane@example.com",
      });

    LogtoClient.prototype.createUser = mockCreateUser;

    const results = await createLogtoUsers(
      sampleProfiles,
      mockConfig,
      "org-123",
      "job-123",
    );

    expect(results).toEqual([
      { id: "user-1", primaryEmail: "john@example.com" },
      { id: "user-2", primaryEmail: "jane@example.com" },
    ]);

    expect(getAccessToken).toHaveBeenCalledWith({
      resource: mockConfig.LOGTO_MANAGEMENT_API_RESOURCE_URL,
      scopes: ["all"],
      applicationId: mockConfig.LOGTO_MANAGEMENT_API_CLIENT_ID,
      applicationSecret: mockConfig.LOGTO_MANAGEMENT_API_CLIENT_SECRET,
      logtoOidcEndpoint: mockConfig.LOGTO_OIDC_ENDPOINT,
    });

    expect(mockCreateUser).toHaveBeenCalledTimes(2);
    expect(mockCreateUser).toHaveBeenCalledWith({
      primaryEmail: "john@example.com",
      username: "john_doe",
      name: "John Doe",
      customData: { organizationId: "org-123", jobId: "job-123" },
    });
  });

  it("should handle partial failures and track successful emails", async () => {
    const mockCreateUser = vi
      .fn()
      .mockResolvedValueOnce({ id: "user-1", primaryEmail: "john@example.com" })
      .mockRejectedValueOnce(new Error("Failed to create user"));

    LogtoClient.prototype.createUser = mockCreateUser;

    const promise = createLogtoUsers(
      sampleProfiles,
      mockConfig,
      "org-123",
      "job-123",
    );

    await expect(promise).rejects.toThrow(
      "Some users failed to be created in Logto",
    );
    await expect(promise).rejects.toMatchObject({
      successfulEmails: ["john@example.com"],
    });
  });

  it("should process users in batches with delay", async () => {
    const manyProfiles = Array(15)
      .fill(null)
      .map((_, i) => ({
        email: `user${i}@example.com`,
        first_name: `User${i}`,
        last_name: "Test",
      }));

    const mockCreateUser = vi.fn().mockImplementation((userData) =>
      Promise.resolve({
        id: `id-${userData.primaryEmail}`,
        primaryEmail: userData.primaryEmail,
      }),
    );

    LogtoClient.prototype.createUser = mockCreateUser;

    const results = await createLogtoUsers(
      manyProfiles,
      mockConfig,
      "org-123",
      "job-123",
    );

    expect(results).toHaveLength(15);
    expect(mockCreateUser).toHaveBeenCalledTimes(15);
  });
});

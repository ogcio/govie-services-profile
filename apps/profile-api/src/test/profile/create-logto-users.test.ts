import { getAccessToken } from "@ogcio/api-auth";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LogtoClient } from "../../clients/logto.js";
import { createLogtoUsers } from "../../services/profiles/create-logto-users.js";
import {
  mockLogtoConfig,
  mockLogtoUsers,
  mockProfiles,
} from "../fixtures/common.js";

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
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should create users in Logto successfully", async () => {
    const mockCreateUser = vi
      .fn()
      .mockResolvedValueOnce(mockLogtoUsers[0])
      .mockResolvedValueOnce(mockLogtoUsers[1]);

    LogtoClient.prototype.createUser = mockCreateUser;

    const results = await createLogtoUsers(
      mockProfiles,
      mockLogtoConfig,
      "org-123",
      "job-123",
    );

    expect(results).toEqual(mockLogtoUsers);

    expect(getAccessToken).toHaveBeenCalledWith({
      resource: mockLogtoConfig.LOGTO_MANAGEMENT_API_RESOURCE_URL,
      scopes: ["all"],
      applicationId: mockLogtoConfig.LOGTO_MANAGEMENT_API_CLIENT_ID,
      applicationSecret: mockLogtoConfig.LOGTO_MANAGEMENT_API_CLIENT_SECRET,
      logtoOidcEndpoint: mockLogtoConfig.LOGTO_OIDC_ENDPOINT,
    });

    expect(mockCreateUser).toHaveBeenCalledTimes(2);
    expect(mockCreateUser).toHaveBeenCalledWith({
      primaryEmail: mockProfiles[0].email,
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
      mockProfiles,
      mockLogtoConfig,
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
        firstName: `User${i}`,
        lastName: "Test",
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
      mockLogtoConfig,
      "org-123",
      "job-123",
    );

    expect(results).toHaveLength(15);
    expect(mockCreateUser).toHaveBeenCalledTimes(15);
  });
});

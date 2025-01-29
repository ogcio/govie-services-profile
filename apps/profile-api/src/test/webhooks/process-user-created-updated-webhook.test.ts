import type { FastifyBaseLogger } from "fastify";
import type { Pool } from "pg";
import { type Mock, beforeEach, describe, expect, it, vi } from "vitest";
import { ImportStatus } from "../../const/profile.js";
import type { LogtoUserCreatedBody } from "../../schemas/webhooks/logto-user-created.js";
import { createUpdateProfileDetails } from "../../services/profiles/create-update-profile-details.js";
import {
  checkIfProfileExists,
  checkProfileImportCompletion,
  createProfile,
  findProfileImportDetailByEmail,
  getProfileImportDetailDataByEmail,
  updateProfileImportDetailsStatus,
  updateProfileImportStatus,
} from "../../services/profiles/sql/index.js";
import { processUserCreatedOrUpdatedWebhook } from "../../services/webhooks/process-user-created-updated-webhook.js";
import { webhookBodyToUser } from "../../services/webhooks/webhook-body-to-user.js";
import { buildMockPg } from "../build-mock-pg.js";

vi.mock("../../services/webhooks/webhook-body-to-user.js");
vi.mock("../../services/profiles/create-update-profile-details.js");
vi.mock("../../services/profiles/sql/check-profile-import-completion.js");
vi.mock("../../services/profiles/sql/create-profile.js");
vi.mock(
  "../../services/profiles/sql/get-profile-import-detail-data-by-email.js",
);
vi.mock("../../services/profiles/sql/find-profile-import-detail-by-email.js");
vi.mock("../../services/profiles/sql/update-profile-import-details-status.js");
vi.mock("../../services/profiles/sql/update-profile-import-status.js");
vi.mock("../../services/profiles/sql/update-profile.js");
vi.mock("../../services/profiles/sql/check-if-profile-exists-by-id.js");

describe("processUserCreatedOrUpdatedWebhook", () => {
  const mockLogger = {
    debug: vi.fn(),
    error: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(checkProfileImportCompletion).mockResolvedValue({
      isComplete: true,
      finalStatus: ImportStatus.COMPLETED,
    });
  });

  it("should process webhook successfully - from job", async () => {
    const mockPg = buildMockPg([
      [{ in_transaction: false }],
      [], // BEGIN
      [
        {
          profile: {
            firstName: "Test",
            lastName: "User",
            email: "test@example.com",
          },
        },
      ],
      [{ id: "profile-123" }],
      [{ in_transaction: true }],
      [{ id: "detail-123" }], // createProfileDetails
      [], // createProfileDataForProfileDetail
      [], // updateProfileDetailsToLatest
      [], // COMMIT
      [{ in_transaction: false }],
      [], // BEGIN
      [
        {
          total: 1,
          completed: 1,
          failed: 0,
          pending: 0,
        },
      ],
      [],
      [], // COMMIT
    ]);

    const mockPool = {
      connect: () => Promise.resolve(mockPg),
    };

    (webhookBodyToUser as Mock).mockReturnValue({
      id: "user-123",
      email: "test@example.com",
      primaryUserId: "user-123",
      organizationId: "org-123",
      profileImportId: "import-123",
    });
    (getProfileImportDetailDataByEmail as Mock).mockReturnValue({
      firstName: "Test",
      lastName: "User",
      email: "test@example.com",
    });
    (createProfile as Mock).mockResolvedValue("profile-123");
    (createUpdateProfileDetails as Mock).mockResolvedValue("detail-123");
    (findProfileImportDetailByEmail as Mock).mockResolvedValue("detail-123");

    const webhookBody = {
      event: "User.Created",
      data: {
        id: "user-123",
        primaryEmail: "test@example.com",
        customData: {
          profileImportId: "import-123",
          organizationId: "org-123",
        },
      },
    };

    const result = await processUserCreatedOrUpdatedWebhook({
      body: webhookBody as unknown as LogtoUserCreatedBody,
      pool: mockPool as unknown as Pool,
      logger: mockLogger as unknown as FastifyBaseLogger,
    });

    expect(result).toEqual({
      id: "profile-123",
      status: "success",
    });

    // Verify the transaction flow
    const queries = mockPg.getExecutedQueries().map((q) => q.sql);
    expect(queries).toContain("BEGIN");
    expect(queries).toContain("COMMIT");
  });

  it("should process webhook successfully - direct signin", async () => {
    const mockPg = buildMockPg([
      [{ in_transaction: false }],
      [], // BEGIN
      [], // CHECK IF PROFILE EXISTS
      [{ id: "profile-123" }], // createProfile
      [], // createProfileDetails
      [], // COMMIT
    ]);

    const mockPool = {
      connect: () => Promise.resolve(mockPg),
    };

    (webhookBodyToUser as Mock).mockReturnValue({
      id: "user-123",
      email: "test@example.com",
      primaryUserId: "user-123",
      details: {
        firstName: "Test",
        lastName: "User",
        email: "test@example.com",
      },
    });

    (checkIfProfileExists as Mock).mockResolvedValue(false);
    (createProfile as Mock).mockResolvedValue("profile-123");
    (createUpdateProfileDetails as Mock).mockResolvedValue("detail-123");

    const webhookBody = {
      event: "User.Created",
      data: {
        id: "user-123",
        primaryEmail: "test@example.com",
        identities: {
          "my-gov-id": {
            details: {
              email: "test@example.com",
              rawData: {
                firstName: "Test",
                lastName: "User",
              },
            },
          },
        },
      },
    };

    const result = await processUserCreatedOrUpdatedWebhook({
      body: webhookBody as unknown as LogtoUserCreatedBody,
      pool: mockPool as unknown as Pool,
      logger: mockLogger as unknown as FastifyBaseLogger,
    });

    expect(result).toEqual({
      id: "user-123",
      status: "success",
    });

    // Verify the transaction flow
    const queries = mockPg.getExecutedQueries().map((q) => q.sql);
    expect(queries).toContain("BEGIN");
    expect(queries).toContain("COMMIT");
  });

  it("should handle profile creation error for job import", async () => {
    const mockPg = buildMockPg([
      [{ in_transaction: false }], // Initial check
      [], // BEGIN
      [{ in_transaction: true }], // Check after BEGIN
      [], // ROLLBACK
      [{ in_transaction: false }], // Check after ROLLBACK

      // Second transaction block (update status)
      [{ in_transaction: false }], // Check before BEGIN
      [], // BEGIN
      [{ in_transaction: true }], // Check after BEGIN
      [{ id: "detail-123" }], // findProfileImportDetailByEmail
      [], // updateProfileImportDetailsStatus
      [], // COMMIT
      [{ in_transaction: false }], // Check after COMMIT

      // Third transaction block (check completion)
      [{ in_transaction: false }], // Check before BEGIN
      [], // BEGIN
      [{ in_transaction: true }], // Check after BEGIN
      [
        {
          total: 1,
          completed: 0,
          failed: 1,
          pending: 0,
        },
      ], // checkProfileImportCompletion
      [], // updateProfileImportStatus
      [], // COMMIT
      [{ in_transaction: false }], // Check after COMMIT
    ]);

    const mockPool = {
      connect: () => Promise.resolve(mockPg),
    };

    const webhookBody = {
      event: "User.Created",
      data: {
        id: "user-123",
        primaryEmail: "test@example.com",
        customData: {
          profileImportId: "import-123",
          organizationId: "org-123",
        },
      },
    };

    (webhookBodyToUser as Mock).mockReturnValue({
      id: "user-123",
      email: "test@example.com",
      primaryUserId: "user-123",
      organizationId: "org-123",
      profileImportId: "import-123",
    });
    (getProfileImportDetailDataByEmail as Mock).mockRejectedValue(
      new Error("Failed to get profile data"),
    );
    (findProfileImportDetailByEmail as Mock).mockResolvedValue("detail-123");
    vi.mocked(checkProfileImportCompletion).mockResolvedValue({
      isComplete: true,
      finalStatus: ImportStatus.FAILED,
    });

    const result = await processUserCreatedOrUpdatedWebhook({
      body: webhookBody as unknown as LogtoUserCreatedBody,
      pool: mockPool as unknown as Pool,
      logger: mockLogger as unknown as FastifyBaseLogger,
    });

    expect(result).toEqual({
      id: undefined,
      status: "error",
      error: "Failed to get profile data",
    });

    // Verify error handling and status updates
    expect(updateProfileImportDetailsStatus).toHaveBeenCalledWith(
      expect.anything(),
      ["detail-123"],
      ImportStatus.FAILED,
    );
    expect(updateProfileImportStatus).toHaveBeenCalledWith(
      expect.anything(),
      "import-123",
      ImportStatus.FAILED,
    );

    // Verify transaction handling
    const queries = mockPg.getExecutedQueries().map((q) => q.sql);
    expect(queries).toContain("BEGIN");
    expect(queries).toContain("ROLLBACK");
    expect(mockLogger.error).toHaveBeenCalled();
  });
});

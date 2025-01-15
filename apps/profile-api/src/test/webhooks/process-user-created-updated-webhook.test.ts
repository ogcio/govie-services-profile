import type { FastifyBaseLogger } from "fastify";
import type { Pool } from "pg";
import { type Mock, beforeEach, describe, expect, it, vi } from "vitest";
import { ImportStatus } from "../../const/profile.js";
import type { LogtoUserCreatedBody } from "../../schemas/webhooks/logto-user-created.js";
import { createUpdateProfileDetails } from "../../services/profiles/create-update-profile-details.js";
import {
  checkImportCompletion,
  createProfile,
  findProfileImportByJobId,
  findProfileImportDetailByEmail,
  getProfileImportDetailDataByEmail,
  updateProfileImportDetailsStatus,
} from "../../services/profiles/sql/index.js";
import { processUserCreatedOrUpdatedWebhook } from "../../services/webhooks/process-user-created-updated-webhook.js";
import { webhookBodyToUser } from "../../services/webhooks/webhook-body-to-user.js";
import { buildMockPg } from "../build-mock-pg.js";

vi.mock("../../services/webhooks/webhook-body-to-user.js");
vi.mock("../../services/profiles/create-update-profile-details.js");
vi.mock("../../services/profiles/sql/check-import-completion.js");
vi.mock("../../services/profiles/sql/create-profile.js");
vi.mock("../../services/profiles/sql/find-profile-import-by-job-id.js");
vi.mock(
  "../../services/profiles/sql/get-profile-import-detail-data-by-email.js",
);
vi.mock("../../services/profiles/sql/find-profile-import-detail-by-email.js");
vi.mock("../../services/profiles/sql/update-profile-import-details-status.js");
describe("processUserCreatedOrUpdatedWebhook", () => {
  const mockLogger = {
    debug: vi.fn(),
    error: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should process webhook successfully", async () => {
    const mockPg = buildMockPg([
      [{ in_transaction: false }],
      [], // BEGIN
      [{ id: "import-123" }],
      [
        {
          profile: {
            first_name: "Test",
            last_name: "User",
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

    // Mock functions if needed (depends on how your code calls them)
    (webhookBodyToUser as Mock).mockReturnValue({
      id: "user-123",
      email: "test@example.com",
      jobId: "job-123",
      organizationId: "org-123",
    });
    (findProfileImportByJobId as Mock).mockReturnValue("import-123");
    (getProfileImportDetailDataByEmail as Mock).mockReturnValue({
      first_name: "Test",
      last_name: "User",
    });
    (createProfile as Mock).mockResolvedValue("profile-123");
    (createUpdateProfileDetails as Mock).mockResolvedValue("detail-123");
    (checkImportCompletion as Mock).mockResolvedValue({
      isComplete: true,
      finalStatus: ImportStatus.COMPLETED,
    });

    const webhookBody = {
      data: {
        id: "user-123",
        primaryEmail: "test@example.com",
        customData: {
          jobId: "job-123",
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

    // Optional: verify the transaction flow
    const queries = mockPg.getExecutedQueries().map((q) => q.sql);
    expect(queries).toContain("BEGIN");
    expect(queries).toContain("COMMIT");
  });

  it("should handle missing jobId", async () => {
    const mockPg = buildMockPg([
      [{ in_transaction: false }],
      [], // BEGIN
      [], // COMMIT
    ]);

    const mockPool = {
      connect: vi.fn().mockResolvedValue(mockPg),
    };

    const webhookBody = {
      data: {
        id: "user-123",
        primaryEmail: "test@example.com",
        customData: {}, // No jobId here
      },
    };

    (webhookBodyToUser as Mock).mockReturnValue({
      id: "user-123",
      email: "test@example.com",
      primaryUserId: "user-123",
      // No jobId here
    });

    const result = await processUserCreatedOrUpdatedWebhook({
      body: webhookBody as unknown as LogtoUserCreatedBody,
      pool: mockPool as unknown as Pool,
      logger: mockLogger as unknown as FastifyBaseLogger,
    });

    expect(result).toEqual({
      id: "user-123",
      status: "success",
    });
  });

  it("should handle profile creation error", async () => {
    const mockPg = buildMockPg([
      [{ in_transaction: false }], // First transaction check
      [], // BEGIN
      [
        {
          id: "import-123",
          organization_id: "org-123",
          status: "PENDING",
        },
      ], // findProfileImportByJobId response
      [
        {
          id: "import-detail-123",
          import_id: "import-123",
          email: "test@example.com",
          data: {
            profile: {
              first_name: "Test",
              last_name: "User",
            },
          },
        },
      ], // getProfileImportDetailDataByEmail response
      [], // createProfile throws error
      [], // ROLLBACK
      [{ in_transaction: false }], // Second transaction check
      [], // BEGIN
      [{ in_transaction: true }], // Transaction check during error handling
      [
        {
          id: "import-123",
        },
      ],
      [{ id: "import-detail-123" }],
      [],
      [], // COMMIT
      [{ in_transaction: false }],
      [], // BEGIN
      [{ in_transaction: true }], // Transaction check during completion check
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
      connect: vi.fn().mockResolvedValue(mockPg),
    };

    const webhookBody = {
      data: {
        id: "user-123",
        primaryEmail: "test@example.com",
        customData: {
          jobId: "job-123",
          organizationId: "org-123",
        },
      },
    };

    (webhookBodyToUser as Mock).mockReturnValue({
      id: "user-123",
      email: "test@example.com",
      jobId: "job-123",
      organizationId: "org-123",
      primaryUserId: "user-123",
    });
    (getProfileImportDetailDataByEmail as Mock).mockReturnValue({
      first_name: "Test",
      last_name: "User",
      email: "test@example.com",
    });
    (createProfile as Mock).mockRejectedValue(new Error("Creation failed"));
    (findProfileImportByJobId as Mock).mockResolvedValue("import-123");
    (findProfileImportDetailByEmail as Mock).mockResolvedValue(
      "import-detail-123",
    );
    (updateProfileImportDetailsStatus as Mock).mockResolvedValue(undefined);

    const result = await processUserCreatedOrUpdatedWebhook({
      body: webhookBody as unknown as LogtoUserCreatedBody,
      pool: mockPool as unknown as Pool,
      logger: mockLogger as unknown as FastifyBaseLogger,
    });

    expect(result).toEqual({
      id: undefined,
      status: "error",
      error: "Creation failed",
    });

    // Verify transaction handling
    const queries = mockPg.getExecutedQueries().map((q) => q.sql);
    expect(queries).toContain("BEGIN");
    expect(queries).toContain("ROLLBACK");
    expect(mockLogger.error).toHaveBeenCalled();
  });
});

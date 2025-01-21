import type { FastifyBaseLogger } from "fastify";
import type { Pool } from "pg";
import { type Mock, afterEach, describe, expect, it, vi } from "vitest";

// Mock declarations first
vi.mock("../../services/profiles/sql/index.js");
vi.mock("../../services/profiles/create-logto-users.js");
vi.mock("../../services/profiles/create-update-profile-details.js");

// Then imports
import { ImportStatus } from "../../const/profile.js";
import { createLogtoUsers } from "../../services/profiles/create-logto-users.js";
import { createUpdateProfileDetails } from "../../services/profiles/create-update-profile-details.js";
import { importProfiles } from "../../services/profiles/import-profiles.js";
import {
  checkImportCompletion,
  createProfileImport,
  createProfileImportDetails,
  getProfileImportStatus,
  lookupProfile,
  updateProfileImportDetails,
  updateProfileImportStatusByJobId,
} from "../../services/profiles/sql/index.js";
import { buildMockPg } from "../build-mock-pg.js";
import {
  mockLogger,
  mockLogtoConfig,
  mockProfiles,
} from "../fixtures/common.js";

describe("importProfiles", () => {
  const jobId = "job-123";
  const importDetailsIds = ["detail-1", "detail-2"];

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should successfully import new profiles", async () => {
    const mockPg = buildMockPg([
      [{ in_transaction: false }], // Initial transaction check
      [], // BEGIN
      [], // COMMIT
      // First profile
      [{ in_transaction: false }], // First withRollback check
      [], // BEGIN
      [], // COMMIT
      // Second profile
      [{ in_transaction: false }], // Second withRollback check
      [], // BEGIN
      [], // COMMIT
      // Logto users creation
      [{ in_transaction: false }], // Third withRollback check
      [], // BEGIN
      [], // updateProfileImportDetailsStatus
      [], // COMMIT
      // Final status update
      [{ in_transaction: false }], // Fourth withRollback check
      [], // BEGIN
      [], // checkImportCompletion
      [], // updateProfileImportStatusByJobId
      [], // COMMIT
    ]);

    (createProfileImport as Mock).mockResolvedValue(jobId);
    (createProfileImportDetails as Mock).mockResolvedValue(importDetailsIds);
    (lookupProfile as Mock).mockResolvedValue({ exists: false });
    (createLogtoUsers as Mock).mockResolvedValue([
      { id: "user-1", primaryEmail: mockProfiles[0].email },
      { id: "user-2", primaryEmail: mockProfiles[1].email },
    ]);
    (checkImportCompletion as Mock).mockResolvedValue({
      isComplete: true,
      finalStatus: ImportStatus.COMPLETED,
    });
    (getProfileImportStatus as Mock).mockResolvedValue(ImportStatus.COMPLETED);
    (createUpdateProfileDetails as Mock).mockResolvedValue(undefined);

    const mockPool = {
      connect: () => Promise.resolve(mockPg),
    };

    const result = await importProfiles({
      pool: mockPool as unknown as Pool,
      logger: mockLogger as unknown as FastifyBaseLogger,
      profiles: mockProfiles,
      organizationId: "org-123",
      config: mockLogtoConfig,
    });

    expect(result).toStrictEqual({ status: ImportStatus.COMPLETED, jobId });
    expect(createProfileImport).toHaveBeenCalledWith(
      mockPg,
      "org-123",
      "csv",
      undefined,
    );
    expect(createProfileImportDetails).toHaveBeenCalledWith(
      mockPg,
      jobId,
      mockProfiles,
    );
    expect(createLogtoUsers).toHaveBeenCalledWith(
      mockProfiles,
      mockLogtoConfig,
      "org-123",
      jobId,
    );
  });

  it("should handle existing profiles", async () => {
    const mockPg = buildMockPg([
      [{ in_transaction: false }], // Initial transaction check
      [], // BEGIN
      [], // COMMIT
      // First profile
      [{ in_transaction: false }], // First withRollback check
      [], // BEGIN
      [], // COMMIT
      // Second profile
      [{ in_transaction: false }], // Second withRollback check
      [], // BEGIN
      [], // COMMIT
      // Final status update
      [{ in_transaction: false }], // Fourth withRollback check
      [], // BEGIN
      [], // checkImportCompletion
      [], // updateProfileImportStatusByJobId
      [], // COMMIT
    ]);

    (createProfileImport as Mock).mockResolvedValue(jobId);
    (createProfileImportDetails as Mock).mockResolvedValue(importDetailsIds);
    (lookupProfile as Mock).mockResolvedValue({
      exists: true,
      profileId: "profile-123",
    });
    (checkImportCompletion as Mock).mockResolvedValue({
      isComplete: true,
      finalStatus: ImportStatus.COMPLETED,
    });
    (getProfileImportStatus as Mock).mockResolvedValue(ImportStatus.COMPLETED);
    (createUpdateProfileDetails as Mock).mockResolvedValue(undefined);

    const mockPool = {
      connect: () => Promise.resolve(mockPg),
    };

    const result = await importProfiles({
      pool: mockPool as unknown as Pool,
      logger: mockLogger as unknown as FastifyBaseLogger,
      profiles: mockProfiles,
      organizationId: "org-123",
      config: mockLogtoConfig,
    });

    expect(result).toStrictEqual({ status: ImportStatus.COMPLETED, jobId });
    expect(createProfileImport).toHaveBeenCalledWith(
      mockPg,
      "org-123",
      "csv",
      undefined,
    );
    expect(createProfileImportDetails).toHaveBeenCalledWith(
      mockPg,
      jobId,
      mockProfiles,
    );
    expect(createLogtoUsers).not.toHaveBeenCalled();
  });

  it("should handle Logto user creation failures", async () => {
    const mockPg = buildMockPg([
      [{ in_transaction: false }], // Initial transaction check
      [], // BEGIN
      [], // COMMIT
      // First profile
      [{ in_transaction: false }], // First withRollback check
      [], // BEGIN
      [], // COMMIT
      // Second profile
      [{ in_transaction: false }], // Second withRollback check
      [], // BEGIN
      [], // COMMIT
      // Logto users creation
      [{ in_transaction: false }], // Third withRollback check
      [], // BEGIN
      [], // COMMIT
      // Final status update
      [{ in_transaction: false }], // Fourth withRollback check
      [], // BEGIN
      [], // checkImportCompletion
      [], // updateProfileImportStatusByJobId
      [], // COMMIT
    ]);

    interface LogtoError extends Error {
      successfulEmails: string[];
    }

    const logtoError = new Error("Logto error") as LogtoError;
    logtoError.successfulEmails = [mockProfiles[0].email];

    (createProfileImport as Mock).mockResolvedValue(jobId);
    (createProfileImportDetails as Mock).mockResolvedValue(importDetailsIds);
    (lookupProfile as Mock).mockResolvedValue({ exists: false });
    (createLogtoUsers as Mock).mockRejectedValue(logtoError);
    (checkImportCompletion as Mock).mockResolvedValue({
      isComplete: true,
      finalStatus: ImportStatus.FAILED,
    });
    (getProfileImportStatus as Mock).mockResolvedValue(ImportStatus.FAILED);

    const mockPool = {
      connect: () => Promise.resolve(mockPg),
    };

    const result = await importProfiles({
      pool: mockPool as unknown as Pool,
      logger: mockLogger as unknown as FastifyBaseLogger,
      profiles: mockProfiles,
      organizationId: "org-123",
      config: mockLogtoConfig,
    });

    expect(result).toStrictEqual({
      status: ImportStatus.FAILED,
      jobId,
    });
    expect(updateProfileImportDetails).toHaveBeenCalled();
    expect(updateProfileImportStatusByJobId).toHaveBeenCalledWith(
      mockPg,
      jobId,
      ImportStatus.FAILED,
    );
  });

  it("should process JSON profiles array", async () => {
    const mockPg = buildMockPg([
      [{ in_transaction: false }], // Initial transaction check
      [], // BEGIN
      [], // COMMIT
    ]);
    mockPg.release = vi.fn();

    const mockPool = {
      connect: () => Promise.resolve(mockPg),
    };

    (createProfileImport as Mock).mockResolvedValue("test-job-id");
    (createProfileImportDetails as Mock).mockResolvedValue(["detail-1"]);
    (lookupProfile as Mock).mockResolvedValue({ exists: false });
    (createLogtoUsers as Mock).mockResolvedValue([
      { id: "user-1", primaryEmail: mockProfiles[0].email },
    ]);
    (checkImportCompletion as Mock).mockResolvedValue({
      isComplete: true,
      finalStatus: ImportStatus.COMPLETED,
    });
    (getProfileImportStatus as Mock).mockResolvedValue(ImportStatus.COMPLETED);

    const result = await importProfiles({
      pool: mockPool as unknown as Pool,
      logger: mockLogger as unknown as FastifyBaseLogger,
      profiles: [mockProfiles[0]],
      organizationId: "test-org",
      config: mockLogtoConfig,
      source: "json",
    });

    expect(result).toEqual({
      status: ImportStatus.COMPLETED,
      jobId: "test-job-id",
    });
    expect(mockPg.release).toHaveBeenCalled();
  });

  it("should process CSV file upload", async () => {
    const mockPg = buildMockPg([
      [{ in_transaction: false }], // Initial transaction check
      [], // BEGIN
      [], // COMMIT
    ]);
    mockPg.release = vi.fn();

    const mockPool = {
      connect: () => Promise.resolve(mockPg),
    };

    const csvContent =
      "firstName,lastName,email,phone,dateOfBirth,address,city\nJohn,Doe,john@example.com,1234567890,1990-01-01,123 Test St,Test City";
    const csvData = Buffer.from(csvContent).toString("base64");

    (createProfileImport as Mock).mockResolvedValue("test-job-id");
    (createProfileImportDetails as Mock).mockResolvedValue(["detail-1"]);
    (lookupProfile as Mock).mockResolvedValue({ exists: false });
    (createLogtoUsers as Mock).mockResolvedValue([
      { id: "user-1", primaryEmail: mockProfiles[0].email },
    ]);
    (checkImportCompletion as Mock).mockResolvedValue({
      isComplete: true,
      finalStatus: ImportStatus.COMPLETED,
    });
    (getProfileImportStatus as Mock).mockResolvedValue(ImportStatus.COMPLETED);

    const result = await importProfiles({
      pool: mockPool as unknown as Pool,
      logger: mockLogger as unknown as FastifyBaseLogger,
      profiles: [{ data: csvData }],
      organizationId: "test-org",
      config: mockLogtoConfig,
      source: "csv",
    });

    expect(result).toEqual({
      status: ImportStatus.COMPLETED,
      jobId: "test-job-id",
    });
    expect(mockPg.release).toHaveBeenCalled();
  });

  it("should process CSV file with metadata", async () => {
    const mockPg = buildMockPg([
      [{ in_transaction: false }], // Initial transaction check
      [], // BEGIN
      [], // COMMIT
    ]);
    mockPg.release = vi.fn();

    const mockPool = {
      connect: () => Promise.resolve(mockPg),
    };

    const fileMetadata = {
      filename: "test.csv",
      mimetype: "text/csv",
      size: 1024,
    };

    (createProfileImport as Mock).mockResolvedValue("test-job-id");
    (createProfileImportDetails as Mock).mockResolvedValue(["detail-1"]);
    (lookupProfile as Mock).mockResolvedValue({ exists: false });
    (createLogtoUsers as Mock).mockResolvedValue([
      { id: "user-1", primaryEmail: mockProfiles[0].email },
    ]);
    (checkImportCompletion as Mock).mockResolvedValue({
      isComplete: true,
      finalStatus: ImportStatus.COMPLETED,
    });
    (getProfileImportStatus as Mock).mockResolvedValue(ImportStatus.COMPLETED);

    await importProfiles({
      pool: mockPool as unknown as Pool,
      logger: mockLogger as unknown as FastifyBaseLogger,
      profiles: [mockProfiles[0]],
      organizationId: "org-123",
      config: mockLogtoConfig,
      source: "csv",
      fileMetadata,
    });

    expect(createProfileImport).toHaveBeenCalledWith(
      mockPg,
      "org-123",
      "csv",
      fileMetadata,
    );
  });

  it("should throw error if neither profiles nor file provided", async () => {
    const mockPg = buildMockPg([
      [{ in_transaction: false }], // Initial transaction check
      [], // BEGIN
      [], // ROLLBACK - needed when error occurs
    ]);
    mockPg.release = vi.fn();

    const mockPool = {
      connect: () => Promise.resolve(mockPg),
    };

    // Set up the error case
    (createProfileImport as Mock).mockRejectedValue(
      new Error("Either profiles or file must be provided"),
    );

    await expect(
      importProfiles({
        pool: mockPool as unknown as Pool,
        logger: mockLogger as unknown as FastifyBaseLogger,
        profiles: [],
        organizationId: "test-org",
        config: mockLogtoConfig,
      }),
    ).rejects.toThrow("Either profiles or file must be provided");
  });
});

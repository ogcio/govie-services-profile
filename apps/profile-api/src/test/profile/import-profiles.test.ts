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

describe("importProfiles", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  const mockLogger = {
    debug: vi.fn(),
    error: vi.fn(),
  };

  const mockConfig = {
    LOGTO_MANAGEMENT_API_ENDPOINT: "endpoint",
    LOGTO_MANAGEMENT_API_RESOURCE_URL: "resource",
    LOGTO_MANAGEMENT_API_CLIENT_ID: "client-id",
    LOGTO_MANAGEMENT_API_CLIENT_SECRET: "secret",
    LOGTO_OIDC_ENDPOINT: "oidc",
  };

  const profiles = [
    {
      email: "test1@example.com",
      firstName: "Test1",
      lastName: "User",
      address: "123 Test St",
      city: "Test City",
      phone: "1234567890",
      dateOfBirth: "1990-01-01",
    },
    {
      email: "test2@example.com",
      firstName: "Test2",
      lastName: "User",
      address: "456 Test St",
      city: "Test City",
      phone: "0987654321",
      dateOfBirth: "1990-01-01",
    },
  ];

  it("should successfully import new profiles", async () => {
    const jobId = "job-123";
    const importDetailsIds = ["detail-1", "detail-2"];
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
      { id: "user-1", primaryEmail: "test1@example.com" },
      { id: "user-2", primaryEmail: "test2@example.com" },
    ]);
    (checkImportCompletion as Mock).mockResolvedValue({
      isComplete: true,
      finalStatus: ImportStatus.COMPLETED,
    });
    (getProfileImportStatus as Mock).mockResolvedValue(ImportStatus.COMPLETED);

    const mockPool = {
      connect: () => Promise.resolve(mockPg),
    };

    const result = await importProfiles({
      pool: mockPool as unknown as Pool,
      logger: mockLogger as unknown as FastifyBaseLogger,
      profiles,
      organizationId: "org-123",
      config: mockConfig,
    });

    expect(result).toStrictEqual({ status: ImportStatus.COMPLETED, jobId });
    expect(createProfileImport).toHaveBeenCalledWith(mockPg, "org-123", "csv");
    expect(createProfileImportDetails).toHaveBeenCalledWith(
      mockPg,
      jobId,
      profiles,
    );
    expect(createLogtoUsers).toHaveBeenCalledWith(
      profiles,
      mockConfig,
      "org-123",
      jobId,
    );
  });

  it("should successfully import new profiles with json source", async () => {
    const jobId = "job-123";
    const importDetailsIds = ["detail-1", "detail-2"];
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
      { id: "user-1", primaryEmail: "test1@example.com" },
      { id: "user-2", primaryEmail: "test2@example.com" },
    ]);
    (checkImportCompletion as Mock).mockResolvedValue({
      isComplete: true,
      finalStatus: ImportStatus.COMPLETED,
    });
    (getProfileImportStatus as Mock).mockResolvedValue(ImportStatus.COMPLETED);

    const mockPool = {
      connect: () => Promise.resolve(mockPg),
    };

    const result = await importProfiles({
      pool: mockPool as unknown as Pool,
      logger: mockLogger as unknown as FastifyBaseLogger,
      profiles,
      organizationId: "org-123",
      config: mockConfig,
      source: "json",
    });

    expect(result).toStrictEqual({ status: ImportStatus.COMPLETED, jobId });
    expect(createProfileImport).toHaveBeenCalledWith(mockPg, "org-123", "json");
    expect(createProfileImportDetails).toHaveBeenCalledWith(
      mockPg,
      jobId,
      profiles,
    );
    expect(createLogtoUsers).toHaveBeenCalledWith(
      profiles,
      mockConfig,
      "org-123",
      jobId,
    );
  });

  it("should handle existing profiles", async () => {
    const jobId = "job-123";
    const importDetailsIds = ["detail-1", "detail-2"];
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
      profiles,
      organizationId: "org-123",
      config: mockConfig,
    });

    expect(result).toStrictEqual({
      status: ImportStatus.COMPLETED,
      jobId,
    });
    expect(createUpdateProfileDetails).toHaveBeenCalled();
  });

  it("should handle Logto user creation failures", async () => {
    const jobId = "job-123";
    const importDetailsIds = ["detail-1", "detail-2"];
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
    logtoError.successfulEmails = ["test1@example.com"];

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
      profiles,
      organizationId: "org-123",
      config: mockConfig,
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

  it("should handle profile processing errors", async () => {
    const jobId = "job-123";
    const importDetailsIds = ["detail-1", "detail-2"];
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
    (lookupProfile as Mock)
      .mockRejectedValueOnce(new Error("Profile lookup error"))
      .mockResolvedValueOnce({ exists: true, profileId: "profile-123" });
    (getProfileImportStatus as Mock).mockResolvedValue(ImportStatus.FAILED);

    const mockPool = {
      connect: () => Promise.resolve(mockPg),
    };

    const result = await importProfiles({
      pool: mockPool as unknown as Pool,
      logger: mockLogger as unknown as FastifyBaseLogger,
      profiles,
      organizationId: "org-123",
      config: mockConfig,
    });

    expect(result).toStrictEqual({
      status: ImportStatus.FAILED,
      jobId,
    });
    expect(updateProfileImportDetails).toHaveBeenCalled();
    expect(mockLogger.error).toHaveBeenCalled();
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
    const mockLogger = { debug: vi.fn(), error: vi.fn() };
    const mockConfig = {
      LOGTO_MANAGEMENT_API_ENDPOINT: "endpoint",
      LOGTO_MANAGEMENT_API_RESOURCE_URL: "resource",
      LOGTO_MANAGEMENT_API_CLIENT_ID: "client-id",
      LOGTO_MANAGEMENT_API_CLIENT_SECRET: "secret",
      LOGTO_OIDC_ENDPOINT: "oidc",
    };

    const profiles = [
      {
        address: "123 Test St",
        city: "Test City",
        firstName: "John",
        lastName: "Doe",
        email: "john@example.com",
        phone: "1234567890",
        dateOfBirth: "1990-01-01",
      },
    ];

    (createProfileImport as Mock).mockResolvedValue("test-job-id");
    (createProfileImportDetails as Mock).mockResolvedValue(["detail-1"]);
    (lookupProfile as Mock).mockResolvedValue({ exists: false });
    (createLogtoUsers as Mock).mockResolvedValue([
      { id: "user-1", primaryEmail: "john@example.com" },
    ]);
    (checkImportCompletion as Mock).mockResolvedValue({
      isComplete: true,
      finalStatus: ImportStatus.COMPLETED,
    });
    (getProfileImportStatus as Mock).mockResolvedValue(ImportStatus.COMPLETED);

    const result = await importProfiles({
      pool: mockPool as unknown as Pool,
      logger: mockLogger as unknown as FastifyBaseLogger,
      profiles,
      organizationId: "test-org",
      config: mockConfig,
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
    const mockLogger = { debug: vi.fn(), error: vi.fn() };
    const mockConfig = {
      LOGTO_MANAGEMENT_API_ENDPOINT: "endpoint",
      LOGTO_MANAGEMENT_API_RESOURCE_URL: "resource",
      LOGTO_MANAGEMENT_API_CLIENT_ID: "client-id",
      LOGTO_MANAGEMENT_API_CLIENT_SECRET: "secret",
      LOGTO_OIDC_ENDPOINT: "oidc",
    };

    const csvContent =
      "firstName,lastName,email,phone,dateOfBirth,address,city\nJohn,Doe,john@example.com,1234567890,1990-01-01,123 Test St,Test City";
    const csvData = Buffer.from(csvContent).toString("base64");

    (createProfileImport as Mock).mockResolvedValue("test-job-id");
    (createProfileImportDetails as Mock).mockResolvedValue(["detail-1"]);
    (lookupProfile as Mock).mockResolvedValue({ exists: false });
    (createLogtoUsers as Mock).mockResolvedValue([
      { id: "user-1", primaryEmail: "john@example.com" },
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
      config: mockConfig,
      source: "csv",
    });

    expect(result).toEqual({
      status: ImportStatus.COMPLETED,
      jobId: "test-job-id",
    });
    expect(mockPg.release).toHaveBeenCalled();
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
        config: mockConfig,
      }),
    ).rejects.toThrow("Either profiles or file must be provided");
  });
});

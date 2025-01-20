import type { FastifyBaseLogger } from "fastify";
import type { Pool } from "pg";
import { type Mock, describe, expect, it, vi } from "vitest";
import { ImportStatus } from "../../const/profile.js";
import { importProfiles } from "../../services/profiles/import-profiles.js";
import {
  type LogtoError,
  createLogtoUsers,
  createUpdateProfileDetails,
} from "../../services/profiles/index.js";
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

vi.mock("../../services/profiles/sql/index.js");
vi.mock("../../services/profiles/index.js");

describe("importProfiles", () => {
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
    expect(createProfileImport).toHaveBeenCalledWith(mockPg, "org-123");
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
    (lookupProfile as Mock).mockResolvedValue({
      exists: true,
      profileId: "profile-123",
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

    expect(result).toStrictEqual({
      status: ImportStatus.COMPLETED,
      jobId,
    });
    expect(createUpdateProfileDetails).toHaveBeenCalled();
    expect(createLogtoUsers).toHaveBeenCalledOnce();
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

    const logtoError = new Error("Logto error") as unknown as LogtoError;
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
});

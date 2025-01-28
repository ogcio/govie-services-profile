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
  checkProfileImportCompletion,
  getProfileImportStatus,
  lookupProfile,
  selectProfileImportDetails,
  updateProfileImportDetails,
  updateProfileImportStatus,
} from "../../services/profiles/sql/index.js";
import { buildMockPg } from "../build-mock-pg.js";
import {
  mockLogger,
  mockLogtoConfig,
  mockProfiles,
} from "../fixtures/common.js";

describe("importProfiles", () => {
  const profileImportId = "import-123";
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
      [], // checkProfileImportCompletion
      [], // updateProfileImportStatus
      [], // COMMIT
    ]);

    (selectProfileImportDetails as Mock).mockResolvedValue(importDetailsIds);
    (lookupProfile as Mock).mockResolvedValue({ exists: false });
    (createLogtoUsers as Mock).mockResolvedValue([
      { id: "user-1", primaryEmail: mockProfiles[0].email },
      { id: "user-2", primaryEmail: mockProfiles[1].email },
    ]);
    (checkProfileImportCompletion as Mock).mockResolvedValue({
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
      profileImportId,
    });

    expect(result).toStrictEqual({
      status: ImportStatus.COMPLETED,
      profileImportId,
    });
    expect(createLogtoUsers).toHaveBeenCalledWith(
      mockProfiles,
      mockLogtoConfig,
      "org-123",
      profileImportId,
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
      [], // checkProfileImportCompletion
      [], // updateProfileImportStatus
      [], // COMMIT
    ]);

    (selectProfileImportDetails as Mock).mockResolvedValue(importDetailsIds);
    (lookupProfile as Mock).mockResolvedValue({
      exists: true,
      profileId: "profile-123",
    });
    (checkProfileImportCompletion as Mock).mockResolvedValue({
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
      profileImportId,
    });

    expect(result).toStrictEqual({
      status: ImportStatus.COMPLETED,
      profileImportId,
    });
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
      [], // checkProfileImportCompletion
      [], // updateProfileImportStatus
      [], // COMMIT
    ]);

    interface LogtoError extends Error {
      successfulEmails: string[];
    }

    const logtoError = new Error("Logto error") as LogtoError;
    logtoError.successfulEmails = [mockProfiles[0].email];

    (selectProfileImportDetails as Mock).mockResolvedValue(importDetailsIds);
    (lookupProfile as Mock).mockResolvedValue({ exists: false });
    (createLogtoUsers as Mock).mockRejectedValue(logtoError);
    (checkProfileImportCompletion as Mock).mockResolvedValue({
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
      profileImportId,
    });

    expect(result).toStrictEqual({
      status: ImportStatus.FAILED,
      profileImportId,
    });
    expect(updateProfileImportDetails).toHaveBeenCalled();
    expect(updateProfileImportStatus).toHaveBeenCalledWith(
      mockPg,
      profileImportId,
      ImportStatus.FAILED,
    );
  });

  it("should handle empty profiles array with completed status", async () => {
    const mockPg = buildMockPg([
      [{ in_transaction: false }], // Initial transaction check
      [], // BEGIN
      [], // COMMIT
      // Final status update
      [{ in_transaction: false }], // Fourth withRollback check
      [], // BEGIN
      [], // updateProfileImportStatus
      [], // COMMIT
    ]);
    mockPg.release = vi.fn();

    const mockPool = {
      connect: () => Promise.resolve(mockPg),
    };

    (selectProfileImportDetails as Mock).mockResolvedValue([]);
    (checkProfileImportCompletion as Mock).mockResolvedValue({
      isComplete: true,
      finalStatus: ImportStatus.COMPLETED,
    });
    (getProfileImportStatus as Mock).mockResolvedValue(ImportStatus.COMPLETED);

    const result = await importProfiles({
      pool: mockPool as unknown as Pool,
      logger: mockLogger as unknown as FastifyBaseLogger,
      profiles: [],
      organizationId: "test-org",
      config: mockLogtoConfig,
      profileImportId,
    });

    expect(result).toStrictEqual({
      status: ImportStatus.COMPLETED,
      profileImportId,
    });
    expect(updateProfileImportStatus).toHaveBeenCalledWith(
      mockPg,
      profileImportId,
      ImportStatus.COMPLETED,
    );
  });
});

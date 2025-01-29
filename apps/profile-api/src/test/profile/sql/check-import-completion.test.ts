import { describe, expect, it } from "vitest";
import { ImportStatus } from "../../../const/profile.js";
import { checkProfileImportCompletion } from "../../../services/profiles/sql/check-profile-import-completion.js";
import { buildMockPg } from "../../build-mock-pg.js";

describe("checkProfileImportCompletion", () => {
  it("should return not complete when there are pending profiles", async () => {
    const mockPg = buildMockPg([
      [{ total: 10, completed: 3, failed: 2, pending: 5 }],
    ]);

    const result = await checkProfileImportCompletion(mockPg, "job-123");

    expect(result).toEqual({
      isComplete: false,
      finalStatus: ImportStatus.PROCESSING,
    });
  });

  it("should return complete and successful when all profiles completed", async () => {
    const mockPg = buildMockPg([
      [{ total: 10, completed: 10, failed: 0, pending: 0 }],
    ]);

    const result = await checkProfileImportCompletion(mockPg, "job-123");

    expect(result).toEqual({
      isComplete: true,
      finalStatus: ImportStatus.COMPLETED,
    });
  });

  it("should return complete and failed when all profiles failed", async () => {
    const mockPg = buildMockPg([
      [{ total: 10, completed: 0, failed: 10, pending: 0 }],
    ]);

    const result = await checkProfileImportCompletion(mockPg, "job-123");

    expect(result).toEqual({
      isComplete: true,
      finalStatus: ImportStatus.FAILED,
    });
  });

  it("should return complete with mixed success/failure", async () => {
    const mockPg = buildMockPg([
      [{ total: 10, completed: 7, failed: 3, pending: 0 }],
    ]);

    const result = await checkProfileImportCompletion(mockPg, "job-123");

    expect(result).toEqual({
      isComplete: true,
      finalStatus: ImportStatus.COMPLETED,
    });
  });

  it("should handle empty import (0 profiles)", async () => {
    const mockPg = buildMockPg([
      [{ total: 0, completed: 0, failed: 0, pending: 0 }],
    ]);

    const result = await checkProfileImportCompletion(mockPg, "job-123");

    expect(result).toEqual({
      isComplete: true,
      finalStatus: ImportStatus.COMPLETED,
    });
  });
});

import { describe, expect, it } from "vitest";
import { ImportStatus } from "../../../const/profile.js";
import { updateProfileImportStatusByJobId } from "../../../services/profiles/sql/update-profile-import-status-by-job-id.js";
import { buildMockPg } from "../../build-mock-pg.js";

describe("updateProfileImportStatusByJobId", () => {
  it("should update profile import status", async () => {
    const mockPg = buildMockPg([[]]);

    await updateProfileImportStatusByJobId(
      mockPg,
      "job-123",
      ImportStatus.COMPLETED,
    );

    const query = mockPg.getExecutedQueries()[0];
    expect(query.sql).toContain("UPDATE profile_imports");
    expect(query.sql).toContain("SET status = $1");
    expect(query.sql).toContain("WHERE job_id = $2");
    expect(query.values).toEqual([ImportStatus.COMPLETED, "job-123"]);
  });

  it("should default to failed status if not provided", async () => {
    const mockPg = buildMockPg([[]]);

    await updateProfileImportStatusByJobId(mockPg, "job-123");

    const query = mockPg.getExecutedQueries()[0];
    expect(query.values).toEqual([ImportStatus.FAILED, "job-123"]);
  });

  it("should use parameterized query for safety", async () => {
    const mockPg = buildMockPg([[]]);

    await updateProfileImportStatusByJobId(
      mockPg,
      "job-123",
      ImportStatus.PROCESSING,
    );

    const query = mockPg.getExecutedQueries()[0];
    expect(query.sql).not.toContain("job-123");
    expect(query.sql).not.toContain("processing");
    expect(query.sql).toContain("$1");
    expect(query.sql).toContain("$2");
  });

  it("should execute update even with no affected rows", async () => {
    const mockPg = buildMockPg([
      [{}], // No rows updated
    ]);

    await expect(
      updateProfileImportStatusByJobId(mockPg, "job-123"),
    ).resolves.not.toThrow();
  });
});

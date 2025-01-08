import { describe, expect, it } from "vitest";
import { ImportStatus } from "../../../const/profile.js";
import { getProfileImportStatus } from "../../../services/profile/sql/get-profile-import-status.js";
import { buildMockPg } from "../../build-mock-pg.js";

describe("getProfileImportStatus", () => {
  it("should return status when found", async () => {
    const mockPg = buildMockPg([[{ status: ImportStatus.PENDING }]]);

    const result = await getProfileImportStatus(mockPg, "job-123");

    expect(result).toBe(ImportStatus.PENDING);

    const query = mockPg.getExecutedQueries()[0];
    expect(query.sql).toContain("SELECT status FROM profile_imports");
    expect(query.sql).toContain("WHERE job_id = $1");
    expect(query.sql).toContain("LIMIT 1");
    expect(query.values).toEqual(["job-123"]);
  });

  it("should throw not found error if no status found", async () => {
    const mockPg = buildMockPg([[]]);

    await expect(
      getProfileImportStatus(mockPg, "non-existent-job"),
    ).rejects.toThrow(
      "Status for profile_import with id non-existent-job not found",
    );
  });

  it("should throw error if status is null", async () => {
    const mockPg = buildMockPg([[{ status: null }]]);

    await expect(getProfileImportStatus(mockPg, "job-123")).rejects.toThrow(
      "Status for profile_import with id job-123 not found",
    );
  });

  it("should use parameterized query for safety", async () => {
    const mockPg = buildMockPg([[{ status: ImportStatus.PROCESSING }]]);

    await getProfileImportStatus(mockPg, "job-123");

    const query = mockPg.getExecutedQueries()[0];
    expect(query.sql).not.toContain("job-123");
    expect(query.sql).toContain("$1");
    expect(query.values).toEqual(["job-123"]);
  });
});

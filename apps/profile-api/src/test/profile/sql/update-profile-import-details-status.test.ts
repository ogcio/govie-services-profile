import { describe, expect, it } from "vitest";
import { ImportStatus } from "../../../const/profile.js";
import { updateProfileImportDetailsStatus } from "../../../services/profiles/sql/update-profile-import-details-status.js";
import { buildMockPg } from "../../build-mock-pg.js";

describe("updateProfileImportDetailsStatus", () => {
  it("should update single profile detail status", async () => {
    const mockPg = buildMockPg([[]]);

    await updateProfileImportDetailsStatus(
      mockPg,
      ["detail-123"],
      ImportStatus.COMPLETED,
    );

    const query = mockPg.getExecutedQueries()[0];
    expect(query.sql).toContain("UPDATE profile_import_details");
    expect(query.sql).toContain("SET status = $1");
    expect(query.sql).toContain("WHERE id IN ($2)");
    expect(query.values).toEqual([ImportStatus.COMPLETED, "detail-123"]);
  });

  it("should update multiple profile details status", async () => {
    const mockPg = buildMockPg([[]]);
    const detailIds = ["detail-123", "detail-456", "detail-789"];

    await updateProfileImportDetailsStatus(
      mockPg,
      detailIds,
      ImportStatus.PROCESSING,
    );

    const query = mockPg.getExecutedQueries()[0];
    expect(query.sql).toContain("UPDATE profile_import_details");
    expect(query.sql).toContain("SET status = $1");
    expect(query.sql).toContain("WHERE id IN ($2,$3,$4)");
    expect(query.values).toEqual([
      ImportStatus.PROCESSING,
      "detail-123",
      "detail-456",
      "detail-789",
    ]);
  });

  it("should handle empty id list", async () => {
    const mockPg = buildMockPg([[]]);

    await updateProfileImportDetailsStatus(mockPg, [], ImportStatus.FAILED);

    const query = mockPg.getExecutedQueries()[0];
    expect(query.sql).toContain("UPDATE profile_import_details");
    expect(query.sql).toContain("SET status = $1");
    expect(query.sql).toContain("WHERE id IN ()");
    expect(query.values).toEqual([ImportStatus.FAILED]);
  });

  it("should use parameterized query for safety", async () => {
    const mockPg = buildMockPg([[]]);

    await updateProfileImportDetailsStatus(
      mockPg,
      ["detail-123"],
      ImportStatus.COMPLETED,
    );

    const query = mockPg.getExecutedQueries()[0];
    expect(query.sql).not.toContain("detail-123");
    expect(query.sql).not.toContain("completed");
    expect(query.sql).toContain("$1");
    expect(query.sql).toContain("$2");
  });
});

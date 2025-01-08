import { describe, expect, it } from "vitest";
import { ImportStatus } from "../../../const/profile.js";
import { updateProfileImportDetails } from "../../../services/profile/sql/update-profile-import-details.js";
import { buildMockPg } from "../../build-mock-pg.js";

describe("updateProfileImportDetails", () => {
  it("should update single profile detail", async () => {
    const mockPg = buildMockPg([[]]);

    await updateProfileImportDetails(
      mockPg,
      ["detail-123"],
      "Test error message",
      ImportStatus.FAILED,
    );

    const query = mockPg.getExecutedQueries()[0];
    expect(query.sql).toContain("UPDATE profile_import_details");
    expect(query.sql).toContain("SET error_message = $1, status = $2");
    expect(query.sql).toContain("WHERE id IN ($3)");
    expect(query.values).toEqual([
      "Test error message",
      ImportStatus.FAILED,
      "detail-123",
    ]);
  });

  it("should update multiple profile details", async () => {
    const mockPg = buildMockPg([[]]);
    const detailIds = ["detail-123", "detail-456", "detail-789"];

    await updateProfileImportDetails(
      mockPg,
      detailIds,
      "Multiple error",
      ImportStatus.FAILED,
    );

    const query = mockPg.getExecutedQueries()[0];
    expect(query.sql).toContain("UPDATE profile_import_details");
    expect(query.sql).toContain("SET error_message = $1, status = $2");
    expect(query.sql).toContain("WHERE id IN ($3,$4,$5)");
    expect(query.values).toEqual([
      "Multiple error",
      ImportStatus.FAILED,
      "detail-123",
      "detail-456",
      "detail-789",
    ]);
  });

  it("should handle empty id list", async () => {
    const mockPg = buildMockPg([[]]);

    await updateProfileImportDetails(
      mockPg,
      [],
      "No profiles error",
      ImportStatus.FAILED,
    );

    const query = mockPg.getExecutedQueries()[0];
    expect(query.sql).toContain("UPDATE profile_import_details");
    expect(query.sql).toContain("SET error_message = $1, status = $2");
    expect(query.sql).toContain("WHERE id IN ()");
    expect(query.values).toEqual(["No profiles error", ImportStatus.FAILED]);
  });

  it("should use parameterized query for safety", async () => {
    const mockPg = buildMockPg([[]]);

    await updateProfileImportDetails(
      mockPg,
      ["detail-123"],
      "SQL injection test",
      ImportStatus.FAILED,
    );

    const query = mockPg.getExecutedQueries()[0];
    expect(query.sql).not.toContain("detail-123");
    expect(query.sql).not.toContain("SQL injection test");
    expect(query.sql).toContain("$1");
    expect(query.sql).toContain("$2");
    expect(query.sql).toContain("$3");
  });
});

import { describe, expect, it } from "vitest";
import { getProfileImportDetails } from "../../../services/profiles/sql/get-profile-import-details.js";
import { buildMockPg } from "../../build-mock-pg.js";
import { mockProfiles } from "../../fixtures/common.js";

describe("getProfileImportDetails", () => {
  const sampleProfiles = mockProfiles.slice(0, 2);

  it("should return profile details when found", async () => {
    const mockPg = buildMockPg([
      [{ data: sampleProfiles[0] }, { data: sampleProfiles[1] }],
    ]);

    const result = await getProfileImportDetails(mockPg, "import-123");

    expect(result).toEqual(sampleProfiles);

    const query = mockPg.getExecutedQueries()[0];
    expect(query.sql).toContain("SELECT data");
    expect(query.sql).toContain("FROM profile_import_details");
    expect(query.sql).toContain("WHERE profile_import_id = $1");
    expect(query.sql).toContain("AND data IS NOT NULL");
    expect(query.sql).toContain("ORDER BY created_at DESC");
    expect(query.values).toEqual(["import-123"]);
  });

  it("should throw error if import ID is missing", async () => {
    const mockPg = buildMockPg([]);

    await expect(getProfileImportDetails(mockPg, "")).rejects.toThrow(
      "Profile import ID is required",
    );
  });

  it("should throw not found error if no details exist", async () => {
    const mockPg = buildMockPg([[]]);

    await expect(getProfileImportDetails(mockPg, "import-123")).rejects.toThrow(
      "No import details found for import ID: import-123",
    );
  });

  it("should throw error if data is not valid profile data", async () => {
    const mockPg = buildMockPg([[{ data: "invalid json" }]]);

    await expect(getProfileImportDetails(mockPg, "import-123")).rejects.toThrow(
      "Invalid profile data format",
    );
  });
});

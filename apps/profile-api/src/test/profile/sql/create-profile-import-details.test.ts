import { describe, expect, it } from "vitest";
import { createProfileImportDetails } from "../../../services/profiles/sql/create-profile-import-details.js";
import { buildMockPg } from "../../build-mock-pg.js";
import { mockProfiles } from "../../fixtures/common.js";

describe("createProfileImportDetails", () => {
  const sampleProfiles = mockProfiles.slice(0, 2);

  it("should insert profile details and return IDs", async () => {
    const mockPg = buildMockPg([
      [{ id: "detail-1" }, { id: "detail-2" }], // Response for createProfileImportDetails
    ]);

    const result = await createProfileImportDetails(
      mockPg,
      "import-123",
      sampleProfiles,
    );

    // Check returned IDs
    expect(result).toEqual(["detail-1", "detail-2"]);

    // Verify queries
    const queries = mockPg.getExecutedQueries();
    expect(queries).toHaveLength(1);

    // Verify import details query
    const detailsQuery = queries[0];
    expect(detailsQuery.sql).toContain("INSERT INTO profile_import_details");
    expect(detailsQuery.sql).toContain("VALUES ($1, $2),($1, $3)");
    expect(detailsQuery.sql).toContain("RETURNING id");
    expect(detailsQuery.values?.[0]).toBe("import-123"); // profile_import_id
    expect(JSON.parse((detailsQuery.values?.[1] as string) ?? "")).toEqual(
      sampleProfiles[0],
    ); // First profile data
    expect(JSON.parse((detailsQuery.values?.[2] as string) ?? "")).toEqual(
      sampleProfiles[1],
    ); // Second profile data
  });

  it("should handle empty profiles array", async () => {
    const mockPg = buildMockPg([
      [], // Empty response for empty insert
    ]);

    const result = await createProfileImportDetails(mockPg, "import-123", []);

    expect(result).toEqual([]);

    // Verify no query was executed for empty profiles
    const queries = mockPg.getExecutedQueries();
    expect(queries).toHaveLength(1);
    expect(queries[0].values).toEqual(["import-123"]);
  });
});

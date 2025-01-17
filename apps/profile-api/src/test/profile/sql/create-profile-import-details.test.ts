import { describe, expect, it } from "vitest";
import { createProfileImportDetails } from "../../../services/profiles/sql/create-profile-import-details.js";
import { buildMockPg } from "../../build-mock-pg.js";

describe("createProfileImportDetails", () => {
  const sampleProfiles = [
    {
      firstName: "John",
      lastName: "Doe",
      email: "john@example.com",
      phone: "123456789",
      address: "123 Main St",
      city: "Dublin",
      dateOfBirth: "1990-01-01",
    },
    {
      firstName: "Jane",
      lastName: "Smith",
      email: "jane@example.com",
      phone: "987654321",
      address: "456 High St",
      city: "Cork",
      dateOfBirth: "1992-02-02",
    },
  ];

  it("should insert profile details and return IDs", async () => {
    const mockPg = buildMockPg([
      [{ id: "import-123" }], // Response for findProfileImportByJobId
      [{ id: "detail-1" }, { id: "detail-2" }], // Response for createProfileImportDetails
    ]);

    const result = await createProfileImportDetails(
      mockPg,
      "job-123",
      sampleProfiles,
    );

    // Check returned IDs
    expect(result).toEqual(["detail-1", "detail-2"]);

    // Verify queries
    const queries = mockPg.getExecutedQueries();
    expect(queries).toHaveLength(2);

    // Verify import details query
    const detailsQuery = queries[1];
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
      [{ id: "import-123" }], // Response for findProfileImportByJobId
      [], // Empty response for empty insert
    ]);

    const result = await createProfileImportDetails(mockPg, "job-123", []);

    expect(result).toEqual([]);
  });

  it("should throw error if profile import not found", async () => {
    const mockPg = buildMockPg([
      [], // No profile import found
    ]);

    await expect(
      createProfileImportDetails(mockPg, "job-123", sampleProfiles),
    ).rejects.toThrow();
  });
});

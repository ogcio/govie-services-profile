import { describe, expect, it } from "vitest";
import { createProfileDataForProfileDetail } from "../../../services/profiles/sql/create-profile-data-for-profile-details.js";
import { buildMockPg } from "../../build-mock-pg.js";
import { mockProfileDetails } from "../../fixtures/common.js";

describe("createProfileDataForProfileDetail", () => {
  it("should handle empty data object without executing query", async () => {
    const mockPg = buildMockPg([[]]);
    const data = {};

    await createProfileDataForProfileDetail(mockPg, "detail-123", data);

    expect(mockPg.getExecutedQueries()).toHaveLength(0);
  });

  it("should insert single value with correct parameters", async () => {
    const mockPg = buildMockPg([[]]);
    const data = { name: mockProfileDetails.name };

    await createProfileDataForProfileDetail(mockPg, "detail-123", data);

    const query = mockPg.getExecutedQueries()[0];
    expect(query.sql).toContain("($1, $2, $3, $4)");
    expect(query.values).toEqual([
      "detail-123",
      "name",
      "string",
      mockProfileDetails.name,
    ]);
  });

  it("should handle all value types correctly", async () => {
    const mockPg = buildMockPg([[]]);
    const data = mockProfileDetails;

    await createProfileDataForProfileDetail(mockPg, "detail-123", data);

    const query = mockPg.getExecutedQueries()[0];
    expect(query.values).toEqual([
      "detail-123",
      "name",
      "string",
      mockProfileDetails.name,
      "age",
      "number",
      String(mockProfileDetails.age),
      "active",
      "boolean",
      String(mockProfileDetails.active),
      "birthDate",
      "date",
      mockProfileDetails.birthDate,
      "notes",
      "string",
      mockProfileDetails.notes,
    ]);
    expect(query.sql).toContain(
      "VALUES ($1, $2, $3, $4),($1, $5, $6, $7),($1, $8, $9, $10),($1, $11, $12, $13),($1, $14, $15, $16)",
    );
  });

  it("should generate correct SQL placeholders", async () => {
    const mockPg = buildMockPg([[]]);
    const data = {
      name: mockProfileDetails.name,
      notes: mockProfileDetails.notes,
    };

    await createProfileDataForProfileDetail(mockPg, "detail-123", data);

    const query = mockPg.getExecutedQueries()[0];
    expect(query.sql).toContain("($1, $2, $3, $4),($1, $5, $6, $7)");
    expect(query.sql).toContain("profile_details_id");
    expect(query.sql).toContain("name");
    expect(query.sql).toContain("value_type");
    expect(query.sql).toContain("value");
  });
});

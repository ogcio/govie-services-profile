import { describe, expect, it } from "vitest";
import { createProfileDataForProfileDetail } from "../../../services/profile/sql/create-profile-data-for-profile-details.js";
import { buildMockPg } from "../../build-mock-pg.js";

describe("createProfileDataForProfileDetail", () => {
  it("should handle empty data object without executing query", async () => {
    const mockPg = buildMockPg([[]]);
    const data = {};

    await createProfileDataForProfileDetail(mockPg, "profile-123", data);

    expect(mockPg.getExecutedQueries()).toHaveLength(0);
  });

  it("should insert single value with correct parameters", async () => {
    const mockPg = buildMockPg([[]]);
    const data = { name: "John Doe" };

    await createProfileDataForProfileDetail(mockPg, "profile-123", data);

    const query = mockPg.getExecutedQueries()[0];
    expect(query.sql).toContain("($1, $2, $3, $4)");
    expect(query.values).toEqual(["profile-123", "name", "string", "John Doe"]);
  });

  it("should handle all value types correctly", async () => {
    const mockPg = buildMockPg([[]]);
    const data = {
      name: "John Doe",
      age: 30,
      active: true,
      birthDate: "2000-01-01T00:00:00.000Z",
      notes: "some notes",
    };

    await createProfileDataForProfileDetail(mockPg, "profile-123", data);

    const query = mockPg.getExecutedQueries()[0];
    expect(query.values).toEqual([
      "profile-123",
      "name",
      "string",
      "John Doe",
      "age",
      "number",
      "30",
      "active",
      "boolean",
      "true",
      "birthDate",
      "date",
      "2000-01-01T00:00:00.000Z",
      "notes",
      "string",
      "some notes",
    ]);
    expect(query.sql).toContain(
      "VALUES ($1, $2, $3, $4),($1, $5, $6, $7),($1, $8, $9, $10),($1, $11, $12, $13),($1, $14, $15, $16)",
    );
  });

  it("should generate correct SQL placeholders", async () => {
    const mockPg = buildMockPg([[]]);
    const data = { key1: "value1", key2: "value2" };

    await createProfileDataForProfileDetail(mockPg, "profile-123", data);

    const query = mockPg.getExecutedQueries()[0];
    expect(query.sql).toContain("($1, $2, $3, $4),($1, $5, $6, $7)");
    expect(query.sql).toContain("profile_details_id");
    expect(query.sql).toContain("name");
    expect(query.sql).toContain("value_type");
    expect(query.sql).toContain("value");
  });
});

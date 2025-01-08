import { describe, expect, it } from "vitest";
import { createProfileDetails } from "../../../services/profile/sql/create-profile-details.js";
import { buildMockPg } from "../../build-mock-pg.js";

describe("createProfileDetails", () => {
  it("should return the inserted row ID", async () => {
    const mockPg = buildMockPg([
      [{ id: "some-generated-id" }], // Mocked response rows
    ]);

    const result = await createProfileDetails(mockPg, "profile-123", "org-123");

    expect(result).toBe("some-generated-id");
    const query = mockPg.getExecutedQueries()[0];
    expect(query.sql).toContain("INSERT INTO profile_details");
    expect(query.sql).toContain("profile_id");
    expect(query.values).toEqual(["profile-123", "org-123", true]);
    expect(result).toBe("some-generated-id");
  });

  it("should throw error if no ID is returned", async () => {
    const mockPg = buildMockPg([
      [], // No rows
    ]);

    await expect(
      createProfileDetails(mockPg, "profile-123", "org-123"),
    ).rejects.toThrowError();
  });

  it("should use parameterized query", async () => {
    const mockPg = buildMockPg([[{ id: "detail-123" }]]);

    await createProfileDetails(mockPg, "profile-123", "org-123");

    const query = mockPg.getExecutedQueries()[0];
    expect(query.sql).toContain("VALUES ($1, $2, $3)");
    expect(query.sql).toContain("RETURNING id");
  });
});

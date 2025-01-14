import { describe, expect, it } from "vitest";
import { updateProfileDetails } from "../../../services/profiles/sql/update-profile-details.js";
import { buildMockPg } from "../../build-mock-pg.js";

describe("updateProfileDetails", () => {
  it("should update is_latest flag for other profile details", async () => {
    const mockPg = buildMockPg([[]]);

    await updateProfileDetails(
      mockPg,
      "detail-123", // profileDetailId
      "org-123", // organizationId
      "profile-123", // profileId
    );

    const query = mockPg.getExecutedQueries()[0];

    // Verify query structure
    expect(query.sql).toContain("UPDATE profile_details");
    expect(query.sql).toContain("SET is_latest = false");
    expect(query.sql).toContain("WHERE id <> $1");
    expect(query.sql).toContain("AND organisation_id = $2");
    expect(query.sql).toContain("AND profile_id = $3");

    // Verify parameters
    expect(query.values).toEqual([
      "detail-123", // id
      "org-123", // organisation_id
      "profile-123", // profile_id
    ]);
  });

  it("should use parameterized query for safety", async () => {
    const mockPg = buildMockPg([[]]);

    await updateProfileDetails(mockPg, "detail-123", "org-123", "profile-123");

    const query = mockPg.getExecutedQueries()[0];
    expect(query.sql).toContain("$1");
    expect(query.sql).toContain("$2");
    expect(query.sql).toContain("$3");
    expect(query.sql).not.toContain("detail-123");
    expect(query.sql).not.toContain("org-123");
    expect(query.sql).not.toContain("profile-123");
  });

  it("should execute update even with no affected rows", async () => {
    const mockPg = buildMockPg([
      { rowCount: 0 }, // No rows updated
    ]);

    await expect(
      updateProfileDetails(mockPg, "detail-123", "org-123", "profile-123"),
    ).resolves.not.toThrow();
  });
});

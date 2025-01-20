import { describe, expect, it } from "vitest";
import { updateProfileDetailsToLatest } from "../../../services/profiles/sql/update-profile-details-to-latest.js";
import { buildMockPg } from "../../build-mock-pg.js";
import { mockDbProfiles } from "../../fixtures/common.js";

describe("updateProfileDetailsToLatest", () => {
  it("should update is_latest flag for other profile details", async () => {
    const mockPg = buildMockPg([[]]);

    await updateProfileDetailsToLatest(
      mockPg,
      "detail-123", // profileDetailId
      "org-123", // organizationId
      mockDbProfiles[0].id, // profileId
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
      mockDbProfiles[0].id, // profile_id
    ]);
  });

  it("should use parameterized query for safety", async () => {
    const mockPg = buildMockPg([[]]);

    await updateProfileDetailsToLatest(
      mockPg,
      "detail-123",
      "org-123",
      mockDbProfiles[0].id,
    );

    const query = mockPg.getExecutedQueries()[0];
    expect(query.sql).toContain("$1");
    expect(query.sql).toContain("$2");
    expect(query.sql).toContain("$3");
    expect(query.sql).not.toContain("detail-123");
    expect(query.sql).not.toContain("org-123");
    expect(query.sql).not.toContain(mockDbProfiles[0].id);
  });

  it("should execute update even with no affected rows", async () => {
    const mockPg = buildMockPg([
      [{}], // No rows updated
    ]);

    await expect(
      updateProfileDetailsToLatest(
        mockPg,
        "detail-123",
        "org-123",
        mockDbProfiles[0].id,
      ),
    ).resolves.not.toThrow();
  });
});

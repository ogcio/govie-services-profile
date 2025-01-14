import { describe, expect, it } from "vitest";
import { lookupProfile } from "../../services/profiles/sql/lookup-profile.js";
import { buildMockPg } from "../build-mock-pg.js";

describe("lookupProfile", () => {
  it("should find profile by direct email match", async () => {
    const mockPg = buildMockPg([
      [
        {
          profile_id: "profile-123",
          profile_detail_id: "detail-123",
        },
      ],
    ]);

    const result = await lookupProfile(mockPg, "john@example.com");

    expect(result).toEqual({
      exists: true,
      profileId: "profile-123",
      profileDetailId: "detail-123",
    });

    const query = mockPg.getExecutedQueries()[0];
    expect(query.sql).toContain("FROM profiles");
    expect(query.sql).toContain("WHERE email = $1");
    expect(query.values).toEqual(["john@example.com"]);
  });

  it("should find profile by profile_data email match", async () => {
    const mockPg = buildMockPg([
      [
        {
          profile_id: "profile-123",
          profile_detail_id: "detail-123",
        },
      ],
    ]);

    const result = await lookupProfile(mockPg, "john@example.com");

    expect(result).toEqual({
      exists: true,
      profileId: "profile-123",
      profileDetailId: "detail-123",
    });

    const query = mockPg.getExecutedQueries()[0];
    expect(query.sql).toContain("FROM profile_data pd");
    expect(query.sql).toContain("JOIN profile_details pdet");
    expect(query.sql).toContain("JOIN profiles p");
  });

  it("should handle no profile found", async () => {
    const mockPg = buildMockPg([[]]);

    const result = await lookupProfile(mockPg, "nonexistent@example.com");

    expect(result).toEqual({
      exists: false,
      profileId: undefined,
      profileDetailId: undefined,
    });
  });

  it("should convert email to lowercase", async () => {
    const mockPg = buildMockPg([
      [
        {
          profile_id: "profile-123",
          profile_detail_id: "detail-123",
        },
      ],
    ]);

    await lookupProfile(mockPg, "John@Example.com");

    const query = mockPg.getExecutedQueries()[0];
    expect(query.values).toEqual(["john@example.com"]);
  });

  it("should exclude deleted profiles", async () => {
    const mockPg = buildMockPg([[]]);

    const query =
      // biome-ignore lint/style/noCommaOperator: It's OK to use the comma operator here
      (await lookupProfile(mockPg, "john@example.com"),
      mockPg.getExecutedQueries()[0]);

    expect(query.sql).toContain("deleted_at IS NULL");
  });

  it("should use correct indexes", async () => {
    const mockPg = buildMockPg([[{}]]);

    const query =
      // biome-ignore lint/style/noCommaOperator: It's OK to use the comma operator here
      (await lookupProfile(mockPg, "test@example.com"),
      mockPg.getExecutedQueries()[0]);

    // Check index hints are present
    expect(query.sql).toContain("idx_profiles_email");
    expect(query.sql).toContain("idx_profile_data_lookup");
    expect(query.sql).toContain("idx_profile_details_latest");
  });
});

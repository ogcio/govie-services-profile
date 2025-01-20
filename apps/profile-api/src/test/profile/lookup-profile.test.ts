import { describe, expect, it } from "vitest";
import { lookupProfile } from "../../services/profiles/sql/lookup-profile.js";
import { buildMockPg } from "../build-mock-pg.js";
import { mockDbProfiles } from "../fixtures/common.js";

describe("lookupProfile", () => {
  it("should find profile by direct email match", async () => {
    const mockPg = buildMockPg([
      [
        {
          profile_id: mockDbProfiles[0].id,
          profile_detail_id: "detail-123",
        },
      ],
    ]);

    const result = await lookupProfile(mockPg, mockDbProfiles[0].email);

    expect(result).toEqual({
      exists: true,
      profileId: mockDbProfiles[0].id,
      profileDetailId: "detail-123",
    });

    const query = mockPg.getExecutedQueries()[0];
    expect(query.sql).toContain("FROM profiles");
    expect(query.sql).toContain("WHERE email = $1");
    expect(query.values).toEqual([mockDbProfiles[0].email]);
  });

  it("should find profile by profile_data email match", async () => {
    const mockPg = buildMockPg([
      [
        {
          profile_id: mockDbProfiles[0].id,
          profile_detail_id: "detail-123",
        },
      ],
    ]);

    const result = await lookupProfile(
      mockPg,
      mockDbProfiles[0].details.email.value,
    );

    expect(result).toEqual({
      exists: true,
      profileId: mockDbProfiles[0].id,
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
          profile_id: mockDbProfiles[0].id,
          profile_detail_id: "detail-123",
        },
      ],
    ]);

    const uppercaseEmail = mockDbProfiles[0].email.toUpperCase();
    await lookupProfile(mockPg, uppercaseEmail);

    const query = mockPg.getExecutedQueries()[0];
    expect(query.values).toEqual([mockDbProfiles[0].email.toLowerCase()]);
  });

  it("should exclude deleted profiles", async () => {
    const mockPg = buildMockPg([[]]);

    const query =
      // biome-ignore lint/style/noCommaOperator: It's OK to use the comma operator here
      (await lookupProfile(mockPg, mockDbProfiles[0].email),
      mockPg.getExecutedQueries()[0]);

    expect(query.sql).toContain("deleted_at IS NULL");
  });

  it("should use correct indexes", async () => {
    const mockPg = buildMockPg([[{}]]);

    const query =
      // biome-ignore lint/style/noCommaOperator: It's OK to use the comma operator here
      (await lookupProfile(mockPg, mockDbProfiles[0].email),
      mockPg.getExecutedQueries()[0]);

    // Check index hints are present
    expect(query.sql).toContain("idx_profiles_email");
    expect(query.sql).toContain("idx_profile_data_lookup");
    expect(query.sql).toContain("idx_profile_details_latest");
  });
});

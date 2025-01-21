import type { Pool } from "pg";
import { describe, expect, it, vi } from "vitest";
import {
  // createUpdateProfileDetails,
  updateProfile,
} from "../../../src/services/profiles/index.js";
import { buildMockPg } from "../../test/build-mock-pg.js";
import { mockDbProfiles } from "../fixtures/common.js";

// vi.mock("../../../src/services/profiles/create-update-profile-details.js");

describe("updateProfile", () => {
  const existingProfile = mockDbProfiles[0];

  it("should update profile with new email and public name", async () => {
    const mockPg = buildMockPg([
      [existingProfile], // findProfileWithData initial check
      [], // updateProfileSql
      [{ in_transaction: false }],
      [], // BEGIN
      [existingProfile], // findProfileWithData
      [{ id: "detail-123" }], // createProfileDetails
      [], // createProfileDataForProfileDetail
      [], // updateProfileDetailsToLatest
      [], // COMMIT
      [
        {
          ...existingProfile,
          email: "new@example.com",
          publicName: "New Name",
        },
      ], // findProfileWithData final result
    ]);

    const mockPool = {
      connect: () => Promise.resolve(mockPg),
    };
    const result = await updateProfile({
      pool: mockPool as unknown as Pool,
      profileId: existingProfile.id,
      organizationId: "org-123",
      data: {
        email: "new@example.com",
        publicName: "New Name",
      },
    });

    expect(result.email).toBe("new@example.com");
    expect(result.publicName).toBe("New Name");

    const queries = mockPg.getExecutedQueries();
    expect(queries).toHaveLength(10);

    // Verify initial profile check
    expect(queries[0].sql).toContain("SELECT");
    expect(queries[0].sql).toContain("FROM profiles p");
    expect(queries[0].values).toEqual(["org-123", existingProfile.id]);

    // Verify profile update
    expect(queries[1].sql).toBe(
      "UPDATE profiles SET public_name = $1, email = $2, preferred_language = COALESCE($3, preferred_language), updated_at = $4 WHERE id = $5",
    );
    expect(queries[1].values?.[0]).toBe("New Name");
    expect(queries[1].values?.[1]).toBe("new@example.com");
    expect(queries[1].values?.[4]).toBe(existingProfile.id);
  });

  it("should update profile details only", async () => {
    const mockPg = buildMockPg([
      [existingProfile], // findProfileWithData initial check
      [{ in_transaction: false }],
      [], // BEGIN
      [existingProfile], // findProfileWithData
      [{ id: "detail-123" }], // createProfileDetails
      [], // createProfileDataForProfileDetail
      [], // updateProfileDetailsToLatest
      [], // COMMIT
      [
        {
          ...existingProfile,
          details: {
            ...existingProfile.details,
            phone: { value: "9876543210", type: "string" },
          },
        },
      ], // findProfileWithData final result
    ]);

    const mockPool = {
      connect: () => Promise.resolve(mockPg),
    };

    const result = await updateProfile({
      pool: mockPool as unknown as Pool,
      profileId: existingProfile.id,
      organizationId: "org-123",
      data: {
        phone: "9876543210",
      },
    });

    expect(result).toBeDefined();
    expect(result.details.phone).toBe("9876543210");

    const queries = mockPg.getExecutedQueries();
    expect(queries).toHaveLength(9); // No profile update query since no email/public_name change
  });

  it("should throw not found error if profile does not exist", async () => {
    const mockPg = buildMockPg([
      [], // findProfileWithData returns no profile
    ]);

    const mockPool = {
      connect: () => Promise.resolve(mockPg),
    };

    await expect(
      updateProfile({
        pool: mockPool as unknown as Pool,
        profileId: "nonexistent",
        organizationId: "org-123",
        data: {
          email: "new@example.com",
        },
      }),
    ).rejects.toThrow("Profile nonexistent not found");
  });

  it("should handle database errors", async () => {
    const mockError = new Error("Database error");
    const mockPg = buildMockPg([
      [existingProfile], // findProfileWithData succeeds
    ]);
    mockPg.query = vi.fn().mockRejectedValue(mockError);

    const mockPool = {
      connect: () => Promise.resolve(mockPg),
    };

    await expect(
      updateProfile({
        pool: mockPool as unknown as Pool,
        profileId: existingProfile.id,
        organizationId: "org-123",
        data: {
          email: "new@example.com",
        },
      }),
    ).rejects.toThrow(mockError);
  });

  it("should preserve existing values when updating partially", async () => {
    const mockPg = buildMockPg([
      [existingProfile], // findProfileWithData initial check
      [], // updateProfileSql
      [{ in_transaction: false }],
      [], // BEGIN
      [existingProfile], // findProfileWithData
      [{ id: "detail-123" }], // createProfileDetails
      [], // createProfileDataForProfileDetail
      [], // updateProfileDetailsToLatest
      [], // COMMIT
      [
        {
          ...existingProfile,
          email: "new@example.com",
        },
      ], // findProfileWithData final result
    ]);

    const mockPool = {
      connect: () => Promise.resolve(mockPg),
    };

    const result = await updateProfile({
      pool: mockPool as unknown as Pool,
      profileId: existingProfile.id,
      organizationId: "org-123",
      data: {
        email: "new@example.com",
      },
    });

    expect(result).toBeDefined();
    expect(result.email).toBe("new@example.com");
    expect(result.publicName).toBe(existingProfile.publicName);

    const queries = mockPg.getExecutedQueries();
    const updateQuery = queries[1];
    expect(updateQuery.values?.[0]).toBe(existingProfile.publicName); // Preserved existing public_name
    expect(updateQuery.values?.[1]).toBe("new@example.com");
  });
});

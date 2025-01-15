import type { Pool } from "pg";
import { describe, expect, it, vi } from "vitest";
import {
  createUpdateProfileDetails,
  updateProfile,
} from "../../../src/services/profiles/index.js";
import { buildMockPg } from "../../test/build-mock-pg.js";

vi.mock("../../../src/services/profiles/create-update-profile-details.js");

describe("updateProfile", () => {
  const existingProfile = {
    id: "profile-123",
    public_name: "Test User",
    email: "test@example.com",
    primary_user_id: "user-123",
    created_at: "2024-01-15T12:00:00Z",
    updated_at: "2024-01-15T12:00:00Z",
    details: {
      first_name: { value: "Test", type: "string" },
      last_name: { value: "User", type: "string" },
      phone: { value: "1234567890", type: "string" },
    },
  };

  it("should update profile with new email and public name", async () => {
    const mockPg = buildMockPg([
      [existingProfile], // findProfileWithData initial check
      [], // updateProfileSql
      [{ in_transaction: false }],
      [],
      [existingProfile],
      [{ detail: "detail-123" }],
      [],
      [{ detail: "detail-123" }], // createUpdateProfileDetails
      [
        {
          ...existingProfile,
          email: "new@example.com",
          public_name: "New Name",
        },
      ], // findProfileWithData final result
    ]);

    const mockPool = {
      connect: () => Promise.resolve(mockPg),
    };

    vi.mocked(createUpdateProfileDetails).mockResolvedValue("detail-123");

    const result = await updateProfile({
      pool: mockPool as unknown as Pool,
      profileId: "profile-123",
      organizationId: "org-123",
      data: {
        email: "new@example.com",
        public_name: "New Name",
      },
    });

    expect(result).toBeDefined();
    expect(result?.email).toBe("new@example.com");
    expect(result?.public_name).toBe("New Name");

    const queries = mockPg.getExecutedQueries();
    expect(queries).toHaveLength(4);

    // Verify initial profile check
    expect(queries[0].sql).toContain("SELECT");
    expect(queries[0].sql).toContain("FROM profiles p");
    expect(queries[0].values).toEqual(["org-123", "profile-123"]);

    // Verify profile update
    expect(queries[1].sql).toBe(
      "UPDATE profiles SET public_name = $1, email = $2, updated_at = $3 WHERE id = $4",
    );
    expect(queries[1].values?.[0]).toBe("New Name");
    expect(queries[1].values?.[1]).toBe("new@example.com");
    expect(queries[1].values?.[3]).toBe("profile-123");
  });

  it("should update profile details only", async () => {
    const mockPg = buildMockPg([
      [existingProfile], // findProfileWithData initial check
      [{ detail: "detail-123" }], // createUpdateProfileDetails
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
      profileId: "profile-123",
      organizationId: "org-123",
      data: {
        phone: "9876543210",
      },
    });

    expect(result).toBeDefined();
    expect(result?.details.phone.value).toBe("9876543210");

    const queries = mockPg.getExecutedQueries();
    expect(queries).toHaveLength(3); // No profile update query since no email/public_name change
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
        profileId: "profile-123",
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
      [{ detail: "detail-123" }], // createUpdateProfileDetails
      [
        {
          ...existingProfile,
          email: "new@example.com",
          public_name: existingProfile.public_name,
        },
      ], // findProfileWithData final result
    ]);

    const mockPool = {
      connect: () => Promise.resolve(mockPg),
    };

    const result = await updateProfile({
      pool: mockPool as unknown as Pool,
      profileId: "profile-123",
      organizationId: "org-123",
      data: {
        email: "new@example.com",
      },
    });

    expect(result).toBeDefined();
    expect(result?.email).toBe("new@example.com");
    expect(result?.public_name).toBe(existingProfile.public_name);

    const queries = mockPg.getExecutedQueries();
    const updateQuery = queries[1];
    expect(updateQuery.values?.[0]).toBe(existingProfile.public_name); // Preserved existing public_name
    expect(updateQuery.values?.[1]).toBe("new@example.com");
  });
});

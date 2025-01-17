import { httpErrors } from "@fastify/sensible";
import type { Pool } from "pg";
import { describe, expect, it, vi } from "vitest";
import { getProfile } from "../../../src/services/profiles/get-profile.js";
import { buildMockPg } from "../../test/build-mock-pg.js";

describe("getProfile", () => {
  const mockFromDbProfile = {
    id: "profile-123",
    public_name: "Test User",
    email: "test@example.com",
    primary_user_id: "user-123",
    safe_level: 1,
    created_at: "2024-01-15T12:00:00Z",
    updated_at: "2024-01-15T12:00:00Z",
    details: {
      firstName: { value: "Test", type: "string" },
      lastName: { value: "User", type: "string" },
      phone: { value: "1234567890", type: "string" },
      email: { value: "e@mail.com", type: "string" },
    },
  };

  const mockProfile = {
    ...mockFromDbProfile,
    details: {
      firstName: mockFromDbProfile.details.firstName.value,
      lastName: mockFromDbProfile.details.lastName.value,
      phone: mockFromDbProfile.details.phone.value,
      email: mockFromDbProfile.details.email.value,
    },
  };

  it("should get profile by id with organization id", async () => {
    const mockPg = buildMockPg([[mockFromDbProfile]]);
    const mockPool = {
      connect: () => Promise.resolve(mockPg),
    };

    const result = await getProfile({
      pool: mockPool as unknown as Pool,
      organizationId: "org-123",
      profileId: "profile-123",
    });

    expect(result).toEqual(mockProfile);
    expect(mockPg.getExecutedQueries()[0].values).toEqual([
      "org-123",
      "profile-123",
    ]);
  });

  it("should get profile by id without organization id", async () => {
    const mockPg = buildMockPg([[mockFromDbProfile]]);
    const mockPool = {
      connect: () => Promise.resolve(mockPg),
    };

    const result = await getProfile({
      pool: mockPool as unknown as Pool,
      organizationId: undefined,
      profileId: "profile-123",
    });

    expect(result).toEqual(mockProfile);
    expect(mockPg.getExecutedQueries()[0].values).toEqual([
      undefined,
      "profile-123",
    ]);
  });

  it("should raise an error when profile is not found", async () => {
    const mockPg = buildMockPg([[]]);
    const mockPool = {
      connect: () => Promise.resolve(mockPg),
    };
    const mockError = httpErrors.notFound(
      "Profile nonexistent-profile not found",
    );

    await expect(
      getProfile({
        pool: mockPool as unknown as Pool,
        organizationId: "org-123",
        profileId: "nonexistent-profile",
      }),
    ).rejects.toThrow(mockError);
    expect(mockPg.getExecutedQueries()[0].values).toEqual([
      "org-123",
      "nonexistent-profile",
    ]);
  });

  it("should handle database errors", async () => {
    const mockError = new Error("Database error");
    const mockPg = buildMockPg([[mockFromDbProfile]]);
    mockPg.query = vi.fn().mockRejectedValue(mockError);
    const mockPool = {
      connect: () => Promise.resolve(mockPg),
    };

    await expect(
      getProfile({
        pool: mockPool as unknown as Pool,
        organizationId: "org-123",
        profileId: "profile-123",
      }),
    ).rejects.toThrow(mockError);
  });
});

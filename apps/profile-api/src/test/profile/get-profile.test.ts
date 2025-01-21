import { httpErrors } from "@fastify/sensible";
import type { Pool } from "pg";
import { describe, expect, it, vi } from "vitest";
import { getProfile } from "../../services/profiles/get-profile.js";
import { buildMockPg } from "../build-mock-pg.js";
import { mockDbProfiles, toApiProfile } from "../fixtures/common.js";

describe("getProfile", () => {
  const mockProfile = toApiProfile(mockDbProfiles[0]);

  it("should get profile by id with organization id", async () => {
    const mockPg = buildMockPg([[mockDbProfiles[0]]]);
    const mockPool = {
      connect: () => Promise.resolve(mockPg),
    };

    const result = await getProfile({
      pool: mockPool as unknown as Pool,
      organizationId: "org-123",
      profileId: mockDbProfiles[0].id,
    });

    expect(result).toEqual(mockProfile);
    expect(mockPg.getExecutedQueries()[0].values).toEqual([
      "org-123",
      mockDbProfiles[0].id,
    ]);
  });

  it("should get profile by id without organization id", async () => {
    const mockPg = buildMockPg([[mockDbProfiles[0]]]);
    const mockPool = {
      connect: () => Promise.resolve(mockPg),
    };

    const result = await getProfile({
      pool: mockPool as unknown as Pool,
      organizationId: undefined,
      profileId: mockDbProfiles[0].id,
    });

    expect(result).toEqual(mockProfile);
    expect(mockPg.getExecutedQueries()[0].values).toEqual([
      undefined,
      mockDbProfiles[0].id,
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
    const mockPg = buildMockPg([[mockDbProfiles[0]]]);
    mockPg.query = vi.fn().mockRejectedValue(mockError);
    const mockPool = {
      connect: () => Promise.resolve(mockPg),
    };

    await expect(
      getProfile({
        pool: mockPool as unknown as Pool,
        organizationId: "org-123",
        profileId: mockDbProfiles[0].id,
      }),
    ).rejects.toThrow(mockError);
  });
});

import { httpErrors } from "@fastify/sensible";
import type { Pool } from "pg";
import { describe, expect, it } from "vitest";
import { findProfile } from "../../services/profiles/find-profile.js";
import { buildMockPg } from "../build-mock-pg.js";
import { mockDbProfiles, toApiProfile } from "../fixtures/common.js";

describe("findProfile", () => {
  const mockProfile = toApiProfile(mockDbProfiles[0]);

  it("should find profile by email", async () => {
    const mockPg = buildMockPg([
      [mockDbProfiles[0]], // Query result
    ]);

    const mockPool = {
      connect: () => Promise.resolve(mockPg),
    };

    const result = await findProfile({
      pool: mockPool as unknown as Pool,
      organizationId: "org-123",
      query: { email: mockDbProfiles[0].email },
    });

    expect(result).toEqual(mockProfile);
    expect(mockPg.getExecutedQueries()[0].values).toEqual([
      "org-123",
      `%${mockDbProfiles[0].email}%`,
    ]);
  });

  it("should find profile by first name", async () => {
    const mockPg = buildMockPg([
      [mockDbProfiles[0]], // Query result
    ]);

    const mockPool = {
      connect: () => Promise.resolve(mockPg),
    };

    const result = await findProfile({
      pool: mockPool as unknown as Pool,
      organizationId: "org-123",
      query: { firstName: mockDbProfiles[0].details.firstName.value },
    });

    expect(result).toEqual(mockProfile);
    expect(mockPg.getExecutedQueries()[0].values).toEqual([
      "org-123",
      `%${mockDbProfiles[0].details.firstName.value}%`,
    ]);
  });

  it("should find profile by last name", async () => {
    const mockPg = buildMockPg([
      [mockDbProfiles[0]], // Query result
    ]);

    const mockPool = {
      connect: () => Promise.resolve(mockPg),
    };

    const result = await findProfile({
      pool: mockPool as unknown as Pool,
      organizationId: "org-123",
      query: { lastName: mockDbProfiles[0].details.lastName.value },
    });

    expect(result).toEqual(mockProfile);
    expect(mockPg.getExecutedQueries()[0].values).toEqual([
      "org-123",
      `%${mockDbProfiles[0].details.lastName.value}%`,
    ]);
  });

  it("should find profile by phone", async () => {
    const mockPg = buildMockPg([
      [mockDbProfiles[0]], // Query result
    ]);

    const mockPool = {
      connect: () => Promise.resolve(mockPg),
    };

    const result = await findProfile({
      pool: mockPool as unknown as Pool,
      organizationId: "org-123",
      query: { phone: mockDbProfiles[0].details.phone.value },
    });

    expect(result).toEqual(mockProfile);
    expect(mockPg.getExecutedQueries()[0].values).toEqual([
      "org-123",
      `%${mockDbProfiles[0].details.phone.value}%`,
    ]);
  });

  it("should find profile with multiple search criteria", async () => {
    const mockPg = buildMockPg([
      [mockDbProfiles[0]], // Query result
    ]);

    const mockPool = {
      connect: () => Promise.resolve(mockPg),
    };

    const result = await findProfile({
      pool: mockPool as unknown as Pool,
      organizationId: "org-123",
      query: {
        email: mockDbProfiles[0].email,
        firstName: mockDbProfiles[0].details.firstName.value,
        lastName: mockDbProfiles[0].details.lastName.value,
      },
    });

    expect(result).toEqual(mockProfile);
    expect(mockPg.getExecutedQueries()[0].values).toEqual([
      "org-123",
      `%${mockDbProfiles[0].email}%`,
      `%${mockDbProfiles[0].details.firstName.value}%`,
      `%${mockDbProfiles[0].details.lastName.value}%`,
    ]);
  });

  it("should throw an error when no profile is found", async () => {
    const mockPg = buildMockPg([
      [], // Empty query result
    ]);
    const mockPool = {
      connect: () => Promise.resolve(mockPg),
    };
    const mockError = httpErrors.notFound("Profile not found");

    await expect(
      findProfile({
        pool: mockPool as unknown as Pool,
        organizationId: "org-123",
        query: { email: "nonexistent@example.com" },
      }),
    ).rejects.toThrow(mockError);
  });
});

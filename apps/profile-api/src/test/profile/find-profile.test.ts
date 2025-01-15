import type { Pool } from "pg";
import { describe, expect, it } from "vitest";
import { findProfile } from "../../../src/services/profiles/find-profile.js";
import { buildMockPg } from "../../test/build-mock-pg.js";

describe("findProfile", () => {
  const mockProfile = {
    id: "profile-123",
    public_name: "Test User",
    email: "test@example.com",
    primary_user_id: "user-123",
    safe_level: 1,
    created_at: "2024-01-15T12:00:00Z",
    updated_at: "2024-01-15T12:00:00Z",
    details: {
      first_name: { value: "Test", type: "string" },
      last_name: { value: "User", type: "string" },
      phone: { value: "1234567890", type: "string" },
    },
  };

  it("should find profile by email", async () => {
    const mockPg = buildMockPg([
      [mockProfile], // Query result
    ]);

    const mockPool = {
      connect: () => Promise.resolve(mockPg),
    };

    const result = await findProfile({
      pool: mockPool as unknown as Pool,
      organizationId: "org-123",
      query: { email: "test@example.com" },
    });

    expect(result).toEqual(mockProfile);
    expect(mockPg.getExecutedQueries()[0].values).toEqual([
      "org-123",
      "%test@example.com%",
    ]);
  });

  it("should find profile by first name", async () => {
    const mockPg = buildMockPg([
      [mockProfile], // Query result
    ]);

    const mockPool = {
      connect: () => Promise.resolve(mockPg),
    };

    const result = await findProfile({
      pool: mockPool as unknown as Pool,
      organizationId: "org-123",
      query: { firstName: "Test" },
    });

    expect(result).toEqual(mockProfile);
    expect(mockPg.getExecutedQueries()[0].values).toEqual([
      "org-123",
      "%Test%",
    ]);
  });

  it("should find profile by last name", async () => {
    const mockPg = buildMockPg([
      [mockProfile], // Query result
    ]);

    const mockPool = {
      connect: () => Promise.resolve(mockPg),
    };

    const result = await findProfile({
      pool: mockPool as unknown as Pool,
      organizationId: "org-123",
      query: { lastName: "User" },
    });

    expect(result).toEqual(mockProfile);
    expect(mockPg.getExecutedQueries()[0].values).toEqual([
      "org-123",
      "%User%",
    ]);
  });

  it("should find profile by phone", async () => {
    const mockPg = buildMockPg([
      [mockProfile], // Query result
    ]);

    const mockPool = {
      connect: () => Promise.resolve(mockPg),
    };

    const result = await findProfile({
      pool: mockPool as unknown as Pool,
      organizationId: "org-123",
      query: { phone: "1234567890" },
    });

    expect(result).toEqual(mockProfile);
    expect(mockPg.getExecutedQueries()[0].values).toEqual([
      "org-123",
      "%1234567890%",
    ]);
  });

  it("should find profile with multiple search criteria", async () => {
    const mockPg = buildMockPg([
      [mockProfile], // Query result
    ]);

    const mockPool = {
      connect: () => Promise.resolve(mockPg),
    };

    const result = await findProfile({
      pool: mockPool as unknown as Pool,
      organizationId: "org-123",
      query: {
        email: "test@example.com",
        firstName: "Test",
        lastName: "User",
      },
    });

    expect(result).toEqual(mockProfile);
    expect(mockPg.getExecutedQueries()[0].values).toEqual([
      "org-123",
      "%test@example.com%",
      "%Test%",
      "%User%",
    ]);
  });

  it("should return undefined when no profile is found", async () => {
    const mockPg = buildMockPg([
      [], // Empty query result
    ]);

    const mockPool = {
      connect: () => Promise.resolve(mockPg),
    };

    const result = await findProfile({
      pool: mockPool as unknown as Pool,
      organizationId: "org-123",
      query: { email: "nonexistent@example.com" },
    });

    expect(result).toBeUndefined();
  });
});

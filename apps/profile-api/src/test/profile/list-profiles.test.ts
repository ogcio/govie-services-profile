import type { Pool } from "pg";
import { describe, expect, it, vi } from "vitest";
import { listProfiles } from "../../../src/services/profiles/list-profiles.js";
import { buildMockPg } from "../../test/build-mock-pg.js";
describe("listProfiles", () => {
  const mockProfiles = [
    {
      id: "profile-123",
      public_name: "Test User 1",
      email: "test1@example.com",
      primary_user_id: "user-123",
      safe_level: 1,
      created_at: "2024-01-15T12:00:00Z",
      updated_at: "2024-01-15T12:00:00Z",
      details: {
        first_name: { value: "Test", type: "string" },
        last_name: { value: "User", type: "string" },
        phone: { value: "1234567890", type: "string" },
      },
    },
    {
      id: "profile-456",
      public_name: "Test User 2",
      email: "test2@example.com",
      primary_user_id: "user-456",
      safe_level: 1,
      created_at: "2024-01-15T12:00:00Z",
      updated_at: "2024-01-15T12:00:00Z",
      details: {
        first_name: { value: "Another", type: "string" },
        last_name: { value: "User", type: "string" },
        phone: { value: "0987654321", type: "string" },
      },
    },
  ];

  it("should list profiles with pagination", async () => {
    const mockCount = [{ count: 2 }];

    const mockPg = buildMockPg([mockCount, mockProfiles]);
    const mockPool = {
      connect: () => Promise.resolve(mockPg),
    };

    const result = await listProfiles({
      pool: mockPool as unknown as Pool,
      organisationId: "org-123",
      pagination: { page: 1, limit: 10 },
    });

    expect(result).toEqual({
      data: mockProfiles,
      total: 2,
    });
    expect(mockPg.getExecutedQueries()[0].values).toEqual(["org-123"]);
    expect(mockPg.getExecutedQueries()[1].values).toEqual([
      "org-123",
      10,
      undefined,
    ]);
  });

  it("should list profiles with search", async () => {
    const mockCount = [{ count: 1 }];

    const mockPg = buildMockPg([mockCount, [mockProfiles[0]]]);
    const mockPool = {
      connect: () => Promise.resolve(mockPg),
    };

    const result = await listProfiles({
      pool: mockPool as unknown as Pool,
      organisationId: "org-123",
      pagination: { page: 1, limit: 10 },
      search: "test",
    });

    expect(result).toEqual({
      data: [mockProfiles[0]],
      total: 1,
    });
    expect(mockPg.getExecutedQueries()[0].values).toEqual([
      "org-123",
      "%test%",
    ]);
    expect(mockPg.getExecutedQueries()[1].values).toEqual([
      "org-123",
      "%test%",
      10,
      undefined,
    ]);
  });

  it("should list active profiles only", async () => {
    const mockCount = [{ count: 2 }];

    const mockPg = buildMockPg([mockCount, mockProfiles]);
    const mockPool = {
      connect: () => Promise.resolve(mockPg),
    };

    const result = await listProfiles({
      pool: mockPool as unknown as Pool,
      organisationId: "org-123",
      pagination: { page: 1, limit: 10 },
      activeOnly: true,
    });

    expect(result).toEqual({
      data: mockProfiles,
      total: 2,
    });
    expect(mockPg.getExecutedQueries()[0].values).toEqual(["org-123"]);
    expect(mockPg.getExecutedQueries()[1].values).toEqual([
      "org-123",
      10,
      undefined,
    ]);
  });

  it("should handle empty results", async () => {
    const mockCount = [{ count: 0 }];

    const mockPg = buildMockPg([mockCount, []]);
    const mockPool = {
      connect: () => Promise.resolve(mockPg),
    };

    const result = await listProfiles({
      pool: mockPool as unknown as Pool,
      organisationId: "org-123",
      pagination: { page: 1, limit: 10 },
    });

    expect(result).toEqual({
      data: [],
      total: 0,
    });
    expect(mockPg.getExecutedQueries()[0].values).toEqual(["org-123"]);
    expect(mockPg.getExecutedQueries()[1].values).toEqual([
      "org-123",
      10,
      undefined,
    ]);
  });

  it("should handle database errors", async () => {
    const mockError = new Error("Database error");
    const mockPg = buildMockPg([]);
    mockPg.query = vi.fn().mockRejectedValue(mockError);
    const mockPool = {
      connect: () => Promise.resolve(mockPg),
    };

    await expect(
      listProfiles({
        pool: mockPool as unknown as Pool,
        organisationId: "org-123",
        pagination: { page: 1, limit: 10 },
      }),
    ).rejects.toThrow(mockError);
  });
});

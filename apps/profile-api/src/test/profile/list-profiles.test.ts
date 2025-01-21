import type { Pool } from "pg";
import { describe, expect, it, vi } from "vitest";
import { listProfiles } from "../../services/profiles/list-profiles.js";
import { buildMockPg } from "../build-mock-pg.js";
import { mockDbProfiles } from "../fixtures/common.js";

describe("listProfiles", () => {
  it("should list profiles with pagination", async () => {
    const mockCount = [{ count: 2 }];

    const mockPg = buildMockPg([mockCount, mockDbProfiles]);
    const mockPool = {
      connect: () => Promise.resolve(mockPg),
    };

    const result = await listProfiles({
      pool: mockPool as unknown as Pool,
      organisationId: "org-123",
      pagination: { page: 1, limit: 10 },
    });

    expect(result).toEqual({
      data: mockDbProfiles,
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

    const mockPg = buildMockPg([mockCount, [mockDbProfiles[0]]]);
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
      data: [mockDbProfiles[0]],
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

    const mockPg = buildMockPg([mockCount, mockDbProfiles]);
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
      data: mockDbProfiles,
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

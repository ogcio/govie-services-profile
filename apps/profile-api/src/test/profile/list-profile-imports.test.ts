import { beforeEach, describe, expect, it, vi } from "vitest";
import { listProfileImports } from "../../services/profiles/list-profile-imports.js";
import { createMockPool, mockProfileImports } from "../fixtures/common.js";

describe("listProfileImports", () => {
  const mockQuery = vi.fn();
  const mockPool = createMockPool(mockQuery);

  const defaultPagination = {
    offset: 0,
    limit: 10,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should list profile imports with default source (csv)", async () => {
    mockQuery
      .mockResolvedValueOnce({
        rows: mockProfileImports.filter((i) => i.source === "csv"),
      })
      .mockResolvedValueOnce({ rows: [{ total: "1" }] });

    const result = await listProfileImports({
      pool: mockPool,
      pagination: defaultPagination,
    });

    expect(result.data).toHaveLength(1);
    expect(result.total).toBe(1);
    expect(result.data[0].source).toBe("csv");
    expect(mockQuery).toHaveBeenCalledTimes(2);
  });

  it("should list profile imports filtered by source", async () => {
    mockQuery
      .mockResolvedValueOnce({
        rows: mockProfileImports.filter((i) => i.source === "json"),
      })
      .mockResolvedValueOnce({ rows: [{ total: "1" }] });

    const result = await listProfileImports({
      pool: mockPool,
      source: "json",
      pagination: defaultPagination,
    });

    expect(result.data).toHaveLength(1);
    expect(result.total).toBe(1);
    expect(result.data[0].source).toBe("json");
    expect(mockQuery).toHaveBeenCalledTimes(2);
  });

  it("should list profile imports filtered by organisation", async () => {
    const organisationId = "org-1";
    mockQuery
      .mockResolvedValueOnce({
        rows: mockProfileImports.filter(
          (i) => i.organisationId === organisationId && i.source === "csv",
        ),
      })
      .mockResolvedValueOnce({ rows: [{ total: "1" }] });

    const result = await listProfileImports({
      pool: mockPool,
      organisationId,
      pagination: defaultPagination,
    });

    expect(result.data).toHaveLength(1);
    expect(result.total).toBe(1);
    expect(result.data[0].organisationId).toBe(organisationId);
    expect(mockQuery).toHaveBeenCalledTimes(2);
  });

  it("should handle pagination correctly", async () => {
    const pagination = { offset: 10, limit: 5 };
    mockQuery
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [{ total: "0" }] });

    await listProfileImports({
      pool: mockPool,
      pagination,
    });

    expect(mockQuery).toHaveBeenCalledTimes(2);
    const [firstCall] = mockQuery.mock.calls;
    expect(firstCall[1]).toContain(pagination.limit);
    expect(firstCall[1]).toContain(pagination.offset);
  });

  it("should handle empty results", async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [{ total: "0" }] });

    const result = await listProfileImports({
      pool: mockPool,
      pagination: defaultPagination,
    });

    expect(result.data).toHaveLength(0);
    expect(result.total).toBe(0);
  });
});

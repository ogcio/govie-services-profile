import type { Pool } from "pg";
import { describe, expect, it, vi } from "vitest";
import { selectProfiles } from "../../../src/services/profiles/select-profiles.js";
import { buildMockPg } from "../../test/build-mock-pg.js";

describe("selectProfiles", () => {
  const mockFromDbProfiles = [
    {
      id: "profile-123",
      public_name: "Test User 1",
      email: "test1@example.com",
      primary_user_id: "user-123",
      created_at: "2024-01-15T12:00:00Z",
      updated_at: "2024-01-15T12:00:00Z",
      details: {
        first_name: { value: "Test", type: "string" },
        last_name: { value: "User", type: "string" },
      },
    },
    {
      id: "profile-456",
      public_name: "Test User 2",
      email: "test2@example.com",
      primary_user_id: "user-456",
      created_at: "2024-01-15T12:00:00Z",
      updated_at: "2024-01-15T12:00:00Z",
      details: {
        first_name: { value: "Another", type: "string" },
        last_name: { value: "User", type: "string" },
      },
    },
  ];
  const mockProfiles = [
    {
      ...mockFromDbProfiles[0],
      details: {
        first_name: mockFromDbProfiles[0].details.first_name.value,
        last_name: mockFromDbProfiles[0].details.last_name.value,
      },
    },
    {
      ...mockFromDbProfiles[1],
      details: {
        first_name: mockFromDbProfiles[1].details.first_name.value,
        last_name: mockFromDbProfiles[1].details.last_name.value,
      },
    },
  ];

  it("should select multiple profiles by ids", async () => {
    const query = {
      sql: `
        SELECT 
          p.id,
          p.public_name,
          p.email,
          p.primary_user_id,
          p.created_at,
          p.updated_at,
          (
            SELECT jsonb_object_agg(pdata.name, 
              jsonb_build_object(
                'value', pdata.value,
                'type', pdata.value_type
              )
            )
            FROM profile_data pdata
            INNER JOIN profile_details pd ON pd.id = pdata.profile_details_id
            WHERE pd.profile_id = p.id 
            AND pd.organisation_id = $1
            AND pd.is_latest = true
          ) as details
        FROM profiles p
        WHERE p.id = ANY($2)
        AND p.deleted_at IS NULL
        ORDER BY p.created_at DESC`,
      parameters: ["org-123", ["profile-123", "profile-456"]],
    };

    const mockPg = buildMockPg([mockFromDbProfiles]);
    const mockPool = {
      connect: () => Promise.resolve(mockPg),
    };

    const result = await selectProfiles({
      pool: mockPool as unknown as Pool,
      organizationId: "org-123",
      profileIds: ["profile-123", "profile-456"],
    });

    expect(result).toEqual(mockProfiles);
    const executedQuery = mockPg.getExecutedQueries()[0];
    expect(executedQuery.sql.replace(/\s+/g, " ").trim()).toBe(
      query.sql.replace(/\s+/g, " ").trim(),
    );
    expect(executedQuery.values).toEqual(query.parameters);
  });

  it("should return empty array when no profiles found", async () => {
    const query = {
      sql: `
        SELECT 
          p.id,
          p.public_name,
          p.email,
          p.primary_user_id,
          p.created_at,
          p.updated_at,
          (
            SELECT jsonb_object_agg(pdata.name, 
              jsonb_build_object(
                'value', pdata.value,
                'type', pdata.value_type
              )
            )
            FROM profile_data pdata
            INNER JOIN profile_details pd ON pd.id = pdata.profile_details_id
            WHERE pd.profile_id = p.id 
            AND pd.organisation_id = $1
            AND pd.is_latest = true
          ) as details
        FROM profiles p
        WHERE p.id = ANY($2)
        AND p.deleted_at IS NULL
        ORDER BY p.created_at DESC`,
      parameters: ["org-123", ["nonexistent-1", "nonexistent-2"]],
    };

    const mockPg = buildMockPg([[]]);
    const mockPool = {
      connect: () => Promise.resolve(mockPg),
    };

    const result = await selectProfiles({
      pool: mockPool as unknown as Pool,
      organizationId: "org-123",
      profileIds: ["nonexistent-1", "nonexistent-2"],
    });

    expect(result).toEqual([]);
    const executedQuery = mockPg.getExecutedQueries()[0];
    expect(executedQuery.sql.replace(/\s+/g, " ").trim()).toBe(
      query.sql.replace(/\s+/g, " ").trim(),
    );
    expect(executedQuery.values).toEqual(query.parameters);
  });

  it("should handle database errors", async () => {
    const mockError = new Error("Database error");
    const mockPg = buildMockPg([]);
    mockPg.query = vi.fn().mockRejectedValue(mockError);
    const mockPool = {
      connect: () => Promise.resolve(mockPg),
    };

    await expect(
      selectProfiles({
        pool: mockPool as unknown as Pool,
        organizationId: "org-123",
        profileIds: ["profile-123"],
      }),
    ).rejects.toThrow(mockError);
  });
});

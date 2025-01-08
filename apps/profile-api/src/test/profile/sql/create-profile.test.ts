import { describe, expect, it } from "vitest";
import { createProfile } from "../../../services/profile/sql/create-profile.js";
import { buildMockPg } from "../../build-mock-pg.js";

describe("createProfile", () => {
  const sampleProfile = {
    id: "profile-123",
    public_name: "John Doe",
    email: "john@example.com",
    primary_user_id: "user-123",
    safe_level: 1,
  };

  it("should insert new profile and return ID", async () => {
    const mockPg = buildMockPg([[{ id: "profile-123" }]]);

    const result = await createProfile(mockPg, sampleProfile);

    expect(result).toBe("profile-123");

    const query = mockPg.getExecutedQueries()[0];
    expect(query.sql).toContain("INSERT INTO profiles");
    expect(query.sql).toContain("ON CONFLICT(id) DO UPDATE SET");
    expect(query.values).toEqual([
      "profile-123", // id
      "John Doe", // public_name
      "john@example.com", // email
      "user-123", // primary_user_id
      1, // safe_level
    ]);
  });

  it("should throw error if insert fails", async () => {
    const mockPg = buildMockPg([[]]); // No rows returned

    await expect(createProfile(mockPg, sampleProfile)).rejects.toThrow(
      "Cannot insert profile!",
    );
  });

  it("should use upsert with proper conditions", async () => {
    const mockPg = buildMockPg([[{ id: "profile-123" }]]);

    await createProfile(mockPg, sampleProfile);

    const query = mockPg.getExecutedQueries()[0];
    expect(query.sql).toContain("ON CONFLICT(id) DO UPDATE SET");
    expect(query.sql).toContain(
      "profiles.public_name IS DISTINCT FROM EXCLUDED.public_name",
    );
    expect(query.sql).toContain(
      "profiles.email IS DISTINCT FROM EXCLUDED.email",
    );
    expect(query.sql).toContain(
      "profiles.safe_level IS DISTINCT FROM EXCLUDED.safe_level",
    );
  });
});

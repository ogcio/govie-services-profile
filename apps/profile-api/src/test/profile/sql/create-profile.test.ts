import { describe, expect, it } from "vitest";
import { createProfile } from "../../../services/profiles/sql/create-profile.js";
import { buildMockPg } from "../../build-mock-pg.js";
import { mockDbProfiles } from "../../fixtures/common.js";

describe("createProfile", () => {
  const sampleProfile = {
    ...mockDbProfiles[0],
    safeLevel: 1,
  };

  it("should insert new profile and return ID", async () => {
    const mockPg = buildMockPg([[{ id: mockDbProfiles[0].id }]]);

    const result = await createProfile(mockPg, sampleProfile);

    expect(result).toBe(mockDbProfiles[0].id);

    const query = mockPg.getExecutedQueries()[0];
    expect(query.sql).toContain("INSERT INTO profiles");
    expect(query.sql).toContain("ON CONFLICT(id) DO UPDATE SET");
    expect(query.values).toEqual([
      mockDbProfiles[0].id, // id
      mockDbProfiles[0].publicName, // public_name
      mockDbProfiles[0].email, // email
      mockDbProfiles[0].primaryUserId, // primary_user_id
      1, // safe_level
      mockDbProfiles[0].preferredLanguage, // preferredLanguage
    ]);
  });

  it("should throw error if insert fails", async () => {
    const mockPg = buildMockPg([[]]); // No rows returned

    await expect(createProfile(mockPg, sampleProfile)).rejects.toThrow(
      "Cannot insert profile!",
    );
  });

  it("should use upsert with proper conditions", async () => {
    const mockPg = buildMockPg([[{ id: mockDbProfiles[0].id }]]);

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
    expect(query.sql).toContain(
      "profiles.preferred_language IS DISTINCT FROM EXCLUDED.preferred_language",
    );
  });

  it("should use default 'en' for preferredLanguage if not provided", async () => {
    const mockPg = buildMockPg([[{ id: mockDbProfiles[0].id }]]);
    const profileWithoutLanguage = {
      id: mockDbProfiles[0].id,
      publicName: mockDbProfiles[0].publicName,
      email: mockDbProfiles[0].email,
      primaryUserId: mockDbProfiles[0].primaryUserId,
      safeLevel: 1,
    };

    await createProfile(mockPg, profileWithoutLanguage);

    const queries = mockPg.getExecutedQueries();
    expect(queries[0]?.values?.[5]).toBe("en"); // preferredLanguage should default to "en"
  });
});

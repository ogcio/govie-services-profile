import { describe, expect, it } from "vitest";
import { updateProfile } from "../../../services/profiles/sql/update-profile.js";
import { buildMockPg } from "../../build-mock-pg.js";
import { mockDbProfiles, mockProfiles } from "../../fixtures/common.js";

describe("updateProfile", () => {
  it("should update profile with all fields", async () => {
    const mockPg = buildMockPg([[]]);

    await updateProfile(
      mockPg,
      mockDbProfiles[0].id,
      `${mockProfiles[0].firstName} ${mockProfiles[0].lastName}`,
      mockProfiles[0].email,
      "ga",
    );

    const query = mockPg.getExecutedQueries()[0];
    expect(query.sql).toContain("UPDATE profiles SET");
    expect(query.sql).toContain(
      "preferred_language = COALESCE($3, preferred_language)",
    );
    expect(query.values).toEqual([
      `${mockProfiles[0].firstName} ${mockProfiles[0].lastName}`, // public_name
      mockProfiles[0].email, // email
      "ga", // preferredLanguage
      expect.any(Date), // updated_at
      mockDbProfiles[0].id, // id
    ]);
  });

  it("should update profile without preferredLanguage", async () => {
    const mockPg = buildMockPg([[]]);

    await updateProfile(
      mockPg,
      mockDbProfiles[0].id,
      `${mockProfiles[0].firstName} ${mockProfiles[0].lastName}`,
      mockProfiles[0].email,
    );

    const query = mockPg.getExecutedQueries()[0];
    expect(query.sql).toContain("UPDATE profiles SET");
    expect(query.sql).toContain(
      "preferred_language = COALESCE($3, preferred_language)",
    );
    expect(query.values).toEqual([
      `${mockProfiles[0].firstName} ${mockProfiles[0].lastName}`, // public_name
      mockProfiles[0].email, // email
      undefined, // preferredLanguage
      expect.any(Date), // updated_at
      mockDbProfiles[0].id, // id
    ]);
  });

  it("should use parameterized query for safety", async () => {
    const mockPg = buildMockPg([[]]);

    await updateProfile(
      mockPg,
      mockDbProfiles[0].id,
      `${mockProfiles[0].firstName} ${mockProfiles[0].lastName}`,
      mockProfiles[0].email,
      mockDbProfiles[0].preferredLanguage,
    );

    const query = mockPg.getExecutedQueries()[0];
    expect(query.sql).not.toContain(mockDbProfiles[0].id);
    expect(query.sql).not.toContain(mockProfiles[0].firstName);
    expect(query.sql).not.toContain(mockProfiles[0].email);
    expect(query.sql).not.toContain(mockDbProfiles[0].preferredLanguage);
    expect(query.sql).toContain("$1");
    expect(query.sql).toContain("$2");
    expect(query.sql).toContain("$3");
    expect(query.sql).toContain("$4");
    expect(query.sql).toContain("$5");
  });

  it("should update profile with new email and public name", async () => {
    const mockPg = buildMockPg([[]]);

    await updateProfile(
      mockPg,
      mockDbProfiles[0].id,
      `${mockProfiles[0].firstName} ${mockProfiles[0].lastName}`,
      mockProfiles[0].email,
    );

    const queries = mockPg.getExecutedQueries();
    expect(queries[0].sql).toBe(
      "UPDATE profiles SET public_name = $1, email = $2, preferred_language = COALESCE($3, preferred_language), updated_at = $4 WHERE id = $5",
    );
    expect(queries[0].values).toEqual([
      `${mockProfiles[0].firstName} ${mockProfiles[0].lastName}`,
      mockProfiles[0].email,
      undefined,
      expect.any(Date),
      mockDbProfiles[0].id,
    ]);
  });
});

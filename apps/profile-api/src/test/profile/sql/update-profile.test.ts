import { describe, expect, it } from "vitest";
import { updateProfile } from "../../../services/profiles/sql/update-profile.js";
import { buildMockPg } from "../../build-mock-pg.js";

describe("updateProfile", () => {
  it("should update profile with all fields", async () => {
    const mockPg = buildMockPg([[]]);

    await updateProfile(
      mockPg,
      "profile-123",
      "John Doe",
      "john@example.com",
      "ga",
    );

    const query = mockPg.getExecutedQueries()[0];
    expect(query.sql).toContain("UPDATE profiles SET");
    expect(query.sql).toContain(
      "preferred_language = COALESCE($3, preferred_language)",
    );
    expect(query.values).toEqual([
      "John Doe", // public_name
      "john@example.com", // email
      "ga", // preferredLanguage
      expect.any(Date), // updated_at
      "profile-123", // id
    ]);
  });

  it("should update profile without preferredLanguage", async () => {
    const mockPg = buildMockPg([[]]);

    await updateProfile(mockPg, "profile-123", "John Doe", "john@example.com");

    const query = mockPg.getExecutedQueries()[0];
    expect(query.sql).toContain("UPDATE profiles SET");
    expect(query.sql).toContain(
      "preferred_language = COALESCE($3, preferred_language)",
    );
    expect(query.values).toEqual([
      "John Doe", // public_name
      "john@example.com", // email
      undefined, // preferredLanguage
      expect.any(Date), // updated_at
      "profile-123", // id
    ]);
  });

  it("should use parameterized query for safety", async () => {
    const mockPg = buildMockPg([[]]);

    await updateProfile(
      mockPg,
      "profile-123",
      "John Doe",
      "john@example.com",
      "en",
    );

    const query = mockPg.getExecutedQueries()[0];
    expect(query.sql).not.toContain("profile-123");
    expect(query.sql).not.toContain("John Doe");
    expect(query.sql).not.toContain("john@example.com");
    expect(query.sql).not.toContain("en");
    expect(query.sql).toContain("$1");
    expect(query.sql).toContain("$2");
    expect(query.sql).toContain("$3");
    expect(query.sql).toContain("$4");
    expect(query.sql).toContain("$5");
  });

  it("should update profile with new email and public name", async () => {
    const mockPg = buildMockPg([[]]);

    await updateProfile(mockPg, "profile-123", "John Doe", "john@example.com");

    const queries = mockPg.getExecutedQueries();
    expect(queries[0].sql).toBe(
      "UPDATE profiles SET public_name = $1, email = $2, preferred_language = COALESCE($3, preferred_language), updated_at = $4 WHERE id = $5",
    );
    expect(queries[0].values).toEqual([
      "John Doe",
      "john@example.com",
      undefined,
      expect.any(Date),
      "profile-123",
    ]);
  });
});

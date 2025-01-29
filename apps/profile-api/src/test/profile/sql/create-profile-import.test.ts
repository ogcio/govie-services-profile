import { describe, expect, it } from "vitest";
import { createProfileImport } from "../../../services/profiles/sql/create-profile-import.js";
import { buildMockPg } from "../../build-mock-pg.js";

describe("createProfileImport", () => {
  it("should create profile import with default source and return IDs", async () => {
    const mockPg = buildMockPg([
      [{ id: "import-123", job_token: "token-123" }],
    ]);

    const result = await createProfileImport(mockPg, "org-123");

    expect(result.profileImportId).toBe("import-123");
    expect(result.jobToken).toBe("token-123");

    // Verify query
    const query = mockPg.getExecutedQueries()[0];
    expect(query.sql).toContain("INSERT INTO profile_imports");
    expect(query.sql).toContain("organisation_id");
    expect(query.sql).toContain("source");
    expect(query.sql).toContain("metadata");
    expect(query.sql).toContain("RETURNING id, job_token");

    // Verify parameters
    expect(query.values?.[0]).toBe("org-123"); // organisation_id
    expect(query.values?.[1]).toBe("csv"); // default source
    expect(query.values?.[2]).toBe("{}"); // default empty metadata
  });

  it("should create profile import with specified source and metadata", async () => {
    const mockPg = buildMockPg([
      [{ id: "import-123", job_token: "token-123" }],
    ]);
    const metadata = { filename: "test.json", size: 1024 };

    const result = await createProfileImport(
      mockPg,
      "org-123",
      "json",
      metadata,
    );

    expect(result.profileImportId).toBe("import-123");
    expect(result.jobToken).toBe("token-123");

    // Verify parameters
    const query = mockPg.getExecutedQueries()[0];
    expect(query.values?.[0]).toBe("org-123"); // organisation_id
    expect(query.values?.[1]).toBe("json"); // specified source
    expect(query.values?.[2]).toBe(JSON.stringify(metadata)); // metadata
  });

  it("should throw error if insert fails", async () => {
    const mockPg = buildMockPg([
      [], // No rows returned
    ]);

    await expect(createProfileImport(mockPg, "org-123")).rejects.toThrow(
      "Cannot insert profile import!",
    );
  });

  it("should use database-generated job tokens", async () => {
    const mockPg = buildMockPg([
      [{ id: "import-123", job_token: "token-123" }],
      [{ id: "import-456", job_token: "token-456" }],
    ]);

    const result1 = await createProfileImport(mockPg, "org-123");
    const result2 = await createProfileImport(mockPg, "org-123");

    expect(result1.jobToken).toBe("token-123");
    expect(result2.jobToken).toBe("token-456");
    expect(result1.profileImportId).toBe("import-123");
    expect(result2.profileImportId).toBe("import-456");
  });
});

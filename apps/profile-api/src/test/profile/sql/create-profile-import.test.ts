import { describe, expect, it } from "vitest";
import { createProfileImport } from "../../../services/profiles/sql/create-profile-import.js";
import { buildMockPg } from "../../build-mock-pg.js";

describe("createProfileImport", () => {
  it("should create profile import with default source and return job ID", async () => {
    const mockPg = buildMockPg([[{ id: "import-123" }]]);

    const jobId = await createProfileImport(mockPg, "org-123");

    // Verify returned job ID is a 32 character hex string
    expect(jobId).toMatch(/^[0-9a-f]{32}$/);

    // Verify query
    const query = mockPg.getExecutedQueries()[0];
    expect(query.sql).toContain("INSERT INTO profile_imports");
    expect(query.sql).toContain("job_id");
    expect(query.sql).toContain("organisation_id");
    expect(query.sql).toContain("source");
    expect(query.sql).toContain("RETURNING id");

    // Verify parameters
    expect(query.values?.[0]).toBe(jobId); // job_id
    expect(query.values?.[1]).toBe("org-123"); // organisation_id
    expect(query.values?.[2]).toBe("csv"); // default source
  });

  it("should create profile import with specified source", async () => {
    const mockPg = buildMockPg([[{ id: "import-123" }]]);

    const jobId = await createProfileImport(mockPg, "org-123", "json");

    // Verify query
    const query = mockPg.getExecutedQueries()[0];
    expect(query.values?.[0]).toBe(jobId); // job_id
    expect(query.values?.[1]).toBe("org-123"); // organisation_id
    expect(query.values?.[2]).toBe("json"); // specified source
  });

  it("should throw error if insert fails", async () => {
    const mockPg = buildMockPg([
      [], // No rows returned
    ]);

    await expect(createProfileImport(mockPg, "org-123")).rejects.toThrow(
      "Cannot insert profile import!",
    );
  });

  it("should use unique job IDs for each call", async () => {
    const mockPg = buildMockPg([
      [{ id: "import-123" }],
      [{ id: "import-456" }],
    ]);

    const jobId1 = await createProfileImport(mockPg, "org-123");
    const jobId2 = await createProfileImport(mockPg, "org-123");

    expect(jobId1).not.toBe(jobId2);
    expect(jobId1).toMatch(/^[0-9a-f]{32}$/);
    expect(jobId2).toMatch(/^[0-9a-f]{32}$/);
  });
});

import { describe, expect, it } from "vitest";
import { getJobTokenForProfileImport } from "../../../services/profiles/sql/index.js";
import { buildMockPg } from "../../build-mock-pg.js";

describe("getJobTokenForProfileImport", () => {
  it("should return profile import ID when found", async () => {
    const mockPg = buildMockPg([[{ job_token: "import-123" }]]);

    const result = await getJobTokenForProfileImport(mockPg, "job-123");

    expect(result).toBe("import-123");

    // Verify query
    const query = mockPg.getExecutedQueries()[0];
    expect(query.sql).toContain("SELECT job_token FROM profile_imports");
    expect(query.sql).toContain("WHERE id = $1");
    expect(query.values).toEqual(["job-123"]);
  });

  it("should return undefined when no profile import found", async () => {
    const mockPg = buildMockPg([
      [], // Empty result
    ]);

    const result = await getJobTokenForProfileImport(
      mockPg,
      "non-existent-job",
    );

    expect(result).toBeUndefined();
  });

  it("should use parameterized query for safety", async () => {
    const mockPg = buildMockPg([[{ id: "import-123" }]]);

    await getJobTokenForProfileImport(mockPg, "job-123");

    const query = mockPg.getExecutedQueries()[0];
    expect(query.sql).not.toContain("job-123");
    expect(query.sql).toContain("$1");
    expect(query.values).toEqual(["job-123"]);
  });
});

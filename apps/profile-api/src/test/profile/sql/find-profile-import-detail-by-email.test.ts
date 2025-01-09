import { describe, expect, it } from "vitest";
import { findProfileImportDetailByEmail } from "../../../services/profile/sql/find-profile-import-detail-by-email.js";
import { buildMockPg } from "../../build-mock-pg.js";

describe("findProfileImportDetailByEmail", () => {
  it("should return profile import detail id when found", async () => {
    const mockPg = buildMockPg([
      [
        {
          id: "detail-123",
        },
      ],
    ]);

    const result = await findProfileImportDetailByEmail(
      mockPg,
      "import-123",
      "test@example.com",
    );

    expect(result).toBe("detail-123");

    const queries = mockPg.getExecutedQueries();
    expect(queries[0].sql).toContain("SELECT id FROM profile_import_details");
    expect(queries[0].values).toEqual(["import-123", "test@example.com"]);
  });

  it("should throw not found error when no detail exists", async () => {
    const mockPg = buildMockPg([[]]);

    await expect(
      findProfileImportDetailByEmail(
        mockPg,
        "import-123",
        "nonexistent@example.com",
      ),
    ).rejects.toThrow("No import details found for email");
  });
});

import { describe, expect, it } from "vitest";
import {
  ProfileDetailsError,
  createUpdateProfileDetails,
} from "../../services/profiles/create-update-profile-details.js";
import { buildMockPg } from "../build-mock-pg.js";

describe("createUpdateProfileDetails", () => {
  const testData = {
    first_name: "John",
    last_name: "Doe",
    email: "john@example.com",
    phone: "123456789",
  };

  it("should create profile details and return detail ID", async () => {
    const mockPg = buildMockPg([
      [{ in_transaction: false }], // isInTransaction check
      [], // BEGIN
      [{ id: "detail-123" }],
      [{ id: "detail-123" }], // createProfileDetails
      [], // createProfileDataForProfileDetail
      [], // updateProfileDetailsToLatest
      [], // COMMIT
    ]);

    const result = await createUpdateProfileDetails(
      mockPg,
      "org-123",
      "profile-123",
      testData,
    );

    expect(result).toBe("detail-123");
    const queries = mockPg.getExecutedQueries();
    expect(queries).toHaveLength(7);
    expect(queries[0].sql).toContain("pg_current_xact_id_if_assigned()");
    expect(queries[1].sql).toBe("BEGIN");
    expect(queries[6].sql).toBe("COMMIT");
  });

  it("should handle ProfileDetailsError and rethrow", async () => {
    const mockPg = buildMockPg([
      [], // Empty response triggers ProfileDetailsError
    ]);

    await expect(
      createUpdateProfileDetails(mockPg, "org-123", "profile-123", testData),
    ).rejects.toThrow(ProfileDetailsError);
  });

  it("should wrap unknown errors in ProfileDetailsError", async () => {
    const mockPg = buildMockPg([
      () => {
        throw new Error("Unknown error");
      },
    ]);

    const error = await createUpdateProfileDetails(
      mockPg,
      "org-123",
      "profile-123",
      testData,
    ).catch((e) => e);

    expect(error).toBeInstanceOf(ProfileDetailsError);
    expect(error.message).toContain("error working on profile details");
  });

  it("should use transaction rollback on failure", async () => {
    const mockPg = buildMockPg([
      [{ in_transaction: false }], // isInTransaction check
      [], // BEGIN
      [{ id: "detail-123" }], // createProfileDetails response
      () => {
        throw new Error("Data insert failed");
      }, // createProfileDataForProfileDetail failure
      [], // ROLLBACK
    ]);

    await expect(
      createUpdateProfileDetails(mockPg, "org-123", "profile-123", testData),
    ).rejects.toThrow();

    // Verify rollback was called
    const queries = mockPg.getExecutedQueries();
    const sqlStatements = queries.map((q) => q.sql);

    // Check that transaction starts and rolls back
    expect(sqlStatements).toContain("BEGIN");
    expect(sqlStatements).toContain("ROLLBACK");

    // Check key operations were attempted
    expect(sqlStatements).toContainEqual(
      expect.stringContaining("pg_current_xact_id_if_assigned()"),
    );
    expect(sqlStatements).toContainEqual(
      expect.stringContaining("INSERT INTO profile_details"),
    );
  });
});

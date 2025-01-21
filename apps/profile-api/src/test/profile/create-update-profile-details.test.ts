import { describe, expect, it } from "vitest";
import {
  ProfileDetailsError,
  createUpdateProfileDetails,
} from "../../services/profiles/create-update-profile-details.js";
import { buildMockPg } from "../build-mock-pg.js";
import { mockDbProfiles, mockProfiles } from "../fixtures/common.js";

describe("createUpdateProfileDetails", () => {
  const testData = {
    firstName: mockProfiles[0].firstName,
    lastName: mockProfiles[0].lastName,
    email: mockProfiles[0].email,
    phone: mockProfiles[0].phone,
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
      mockDbProfiles[0].id,
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
      createUpdateProfileDetails(
        mockPg,
        "org-123",
        mockDbProfiles[0].id,
        testData,
      ),
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
      mockDbProfiles[0].id,
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
      createUpdateProfileDetails(
        mockPg,
        "org-123",
        mockDbProfiles[0].id,
        testData,
      ),
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

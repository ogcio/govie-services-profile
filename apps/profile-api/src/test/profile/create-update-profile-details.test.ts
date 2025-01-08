import { describe, expect, it } from "vitest";
import {
  ProfileDetailsError,
  createUpdateProfileDetails,
} from "../../../services/profile/create-update-profile-details.js";
import { buildMockPg } from "../../build-mock-pg.js";

describe("createUpdateProfileDetails", () => {
  const testData = {
    first_name: "John",
    last_name: "Doe",
    email: "john@example.com",
    phone: "123456789",
  };

  it("should create profile details and return detail ID", async () => {
    const mockPg = buildMockPg([
      [{ id: "detail-123" }], // createProfileDetails response
      [], // createProfileDataForProfileDetail response
      [], // updateProfileDetails response
    ]);

    const result = await createUpdateProfileDetails(
      mockPg,
      "org-123",
      "profile-123",
      testData,
    );

    expect(result).toBe("detail-123");

    // Verify all queries executed in correct order
    const queries = mockPg.getExecutedQueries();
    expect(queries).toHaveLength(3);

    // Check createProfileDetails
    const createQuery = queries[0];
    expect(createQuery.sql).toContain("INSERT INTO profile_details");
    expect(createQuery.values).toEqual(["profile-123", "org-123", true]);

    // Check createProfileDataForProfileDetail
    const dataQuery = queries[1];
    expect(dataQuery.sql).toContain("INSERT INTO profile_data");
    expect(dataQuery.sql).toContain("profile_details_id");

    // Check updateProfileDetails
    const updateQuery = queries[2];
    expect(updateQuery.sql).toContain("UPDATE profile_details");
    expect(updateQuery.sql).toContain("SET is_latest = false");
    expect(updateQuery.values).toEqual([
      "detail-123",
      "org-123",
      "profile-123",
    ]);
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
    expect(error.message).toContain("Failed to create/update profile details");
    expect(error.message).toContain("Unknown error");
  });

  it("should use transaction rollback on failure", async () => {
    const mockPg = buildMockPg([
      [{ id: "detail-123" }],
      () => {
        throw new Error("Data insert failed");
      },
    ]);

    await expect(
      createUpdateProfileDetails(mockPg, "org-123", "profile-123", testData),
    ).rejects.toThrow();

    // Verify rollback was called
    const queries = mockPg.getExecutedQueries();
    expect(queries.some((q) => q.sql.includes("ROLLBACK"))).toBe(true);
  });
});

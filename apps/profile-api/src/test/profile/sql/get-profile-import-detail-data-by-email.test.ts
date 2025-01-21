import { describe, expect, it } from "vitest";
import {
  ProfileImportDetailNotFoundError,
  getProfileImportDetailDataByEmail,
} from "../../../services/profiles/sql/get-profile-import-detail-data-by-email.js";
import { buildMockPg } from "../../build-mock-pg.js";
import { mockProfiles } from "../../fixtures/common.js";

describe("getProfileImportDetailDataByEmail", () => {
  const sampleProfile = {
    firstName: mockProfiles[0].firstName,
    lastName: mockProfiles[0].lastName,
    email: mockProfiles[0].email,
    phone: mockProfiles[0].phone,
    address: mockProfiles[0].address,
    city: mockProfiles[0].city,
    dateOfBirth: mockProfiles[0].dateOfBirth,
  };

  it("should return profile data when found", async () => {
    const mockPg = buildMockPg([[{ profile: sampleProfile }]]);

    const result = await getProfileImportDetailDataByEmail(
      mockPg,
      "import-123",
      mockProfiles[0].email,
    );

    expect(result).toEqual(sampleProfile);

    const query = mockPg.getExecutedQueries()[0];
    expect(query.sql).toContain("SELECT data as profile");
    expect(query.sql).toContain("FROM profile_import_details");
    expect(query.sql).toContain("WHERE profile_import_id = $1");
    expect(query.sql).toContain("AND data->>'email' = $2");
    expect(query.values).toEqual(["import-123", mockProfiles[0].email]);
  });

  it("should throw error if profile import ID is missing", async () => {
    const mockPg = buildMockPg([]);

    await expect(
      getProfileImportDetailDataByEmail(mockPg, "", mockProfiles[0].email),
    ).rejects.toThrow("Profile import ID is required");
  });

  it("should throw error if email is missing", async () => {
    const mockPg = buildMockPg([]);

    await expect(
      getProfileImportDetailDataByEmail(mockPg, "import-123", ""),
    ).rejects.toThrow("Email is required");
  });

  it("should throw ProfileImportDetailNotFoundError if no profile found", async () => {
    const mockPg = buildMockPg([[]]);

    await expect(
      getProfileImportDetailDataByEmail(
        mockPg,
        "import-123",
        mockProfiles[0].email,
      ),
    ).rejects.toThrow(ProfileImportDetailNotFoundError);
  });

  it("should handle null data field", async () => {
    const mockPg = buildMockPg([[{ profile: null }]]);

    await expect(
      getProfileImportDetailDataByEmail(
        mockPg,
        "import-123",
        mockProfiles[0].email,
      ),
    ).rejects.toThrow(ProfileImportDetailNotFoundError);
  });
});

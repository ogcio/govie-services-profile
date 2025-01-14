import { describe, expect, it } from "vitest";
import {
  ProfileImportDetailNotFoundError,
  getProfileImportDetailDataByEmail,
} from "../../../services/profiles/sql/get-profile-import-detail-data-by-email.js";
import { buildMockPg } from "../../build-mock-pg.js";

describe("getProfileImportDetailDataByEmail", () => {
  const sampleProfile = {
    first_name: "John",
    last_name: "Doe",
    email: "john@example.com",
    phone: "123456789",
    address: "123 Main St",
    city: "Dublin",
    date_of_birth: "1990-01-01",
  };

  it("should return profile data when found", async () => {
    const mockPg = buildMockPg([[{ profile: sampleProfile }]]);

    const result = await getProfileImportDetailDataByEmail(
      mockPg,
      "import-123",
      "john@example.com",
    );

    expect(result).toEqual(sampleProfile);

    const query = mockPg.getExecutedQueries()[0];
    expect(query.sql).toContain("SELECT data as profile");
    expect(query.sql).toContain("FROM profile_import_details");
    expect(query.sql).toContain("WHERE profile_import_id = $1");
    expect(query.sql).toContain("AND data->>'email' = $2");
    expect(query.values).toEqual(["import-123", "john@example.com"]);
  });

  it("should throw error if profile import ID is missing", async () => {
    const mockPg = buildMockPg([]);

    await expect(
      getProfileImportDetailDataByEmail(mockPg, "", "john@example.com"),
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
        "john@example.com",
      ),
    ).rejects.toThrow(ProfileImportDetailNotFoundError);
  });

  it("should handle null data field", async () => {
    const mockPg = buildMockPg([[{ profile: null }]]);

    await expect(
      getProfileImportDetailDataByEmail(
        mockPg,
        "import-123",
        "john@example.com",
      ),
    ).rejects.toThrow(ProfileImportDetailNotFoundError);
  });
});

import type { Pool } from "pg";
import { describe, expect, it, vi } from "vitest";
import type {
  KnownProfileDataDetails,
  ProfileWithDetails,
  ProfileWithDetailsFromDb,
} from "../../schemas/profiles/model.js";
import { selectProfiles } from "../../services/profiles/select-profiles.js";
import { mockDbProfiles, toApiProfile } from "../fixtures/common.js";

// Mock all dependencies
vi.mock("../../services/profiles/sql/index.js", () => ({
  selectProfilesWithData: vi.fn(),
}));

vi.mock("../../schemas/profiles/shared.js", () => ({
  parseProfilesDetails: vi.fn((profiles: ProfileWithDetailsFromDb[]) =>
    profiles.map((profile) => {
      const details = profile.details
        ? Object.entries(profile.details).reduce((acc, [key, value]) => {
            return Object.assign({}, acc, { [key]: value.value });
          }, {} as KnownProfileDataDetails)
        : undefined;

      return Object.assign({}, profile, { details }) as ProfileWithDetails;
    }),
  ),
}));

vi.mock("../../utils/index.js", () => ({
  withClient: vi.fn((_pool, fn) => {
    const mockClient = { query: vi.fn() };
    return fn(mockClient);
  }),
}));

describe("selectProfiles", () => {
  const mockPool = {
    connect: vi.fn(),
  } as unknown as Pool;

  it("should transform DB profiles to API format", async () => {
    const { selectProfilesWithData } = await import(
      "../../services/profiles/sql/index.js"
    );
    (
      selectProfilesWithData as unknown as ReturnType<typeof vi.fn>
    ).mockResolvedValue(mockDbProfiles);

    const transformedProfiles = await selectProfiles({
      pool: mockPool,
      organizationId: "org-123",
      profileIds: ["profile-123", "profile-456"],
    });

    const expectedProfiles = mockDbProfiles.map((profile) =>
      toApiProfile(profile),
    );

    expect(transformedProfiles).toEqual(expectedProfiles);

    expect(selectProfilesWithData).toHaveBeenCalledWith(
      expect.any(Object),
      "org-123",
      ["profile-123", "profile-456"],
    );
  });

  it("should return empty array when no profiles found", async () => {
    const { selectProfilesWithData } = await import(
      "../../services/profiles/sql/index.js"
    );
    (
      selectProfilesWithData as unknown as ReturnType<typeof vi.fn>
    ).mockResolvedValue([]);

    const result = await selectProfiles({
      pool: mockPool,
      organizationId: "org-123",
      profileIds: ["nonexistent-1", "nonexistent-2"],
    });

    expect(result).toEqual([]);
    expect(selectProfilesWithData).toHaveBeenCalledWith(
      expect.any(Object),
      "org-123",
      ["nonexistent-1", "nonexistent-2"],
    );
  });

  it("should handle database errors", async () => {
    const { selectProfilesWithData } = await import(
      "../../services/profiles/sql/index.js"
    );
    const mockError = new Error("Database error");
    (
      selectProfilesWithData as unknown as ReturnType<typeof vi.fn>
    ).mockRejectedValue(mockError);

    await expect(
      selectProfiles({
        pool: mockPool,
        organizationId: "org-123",
        profileIds: ["profile-123"],
      }),
    ).rejects.toThrow(mockError);
  });
});

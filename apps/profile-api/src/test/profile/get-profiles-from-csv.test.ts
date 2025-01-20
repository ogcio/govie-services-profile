import os from "os";
import path from "path";
import fs from "fs/promises";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { getProfilesFromCsv } from "../../services/profiles/get-profiles-from-csv.js";
import { mockProfiles } from "../fixtures/common.js";

describe("getProfilesFromCsv", () => {
  const tempDir = path.join(os.tmpdir(), "profile-api-tests");

  beforeEach(async () => {
    await fs.mkdir(tempDir, { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it("should successfully parse a valid CSV file", async () => {
    const csvContent = `firstName,lastName,email,phone,dateOfBirth,address,city,preferredLanguage
${mockProfiles[0].firstName},${mockProfiles[0].lastName},${mockProfiles[0].email},${mockProfiles[0].phone},${mockProfiles[0].dateOfBirth},${mockProfiles[0].address},${mockProfiles[0].city},en
${mockProfiles[1].firstName},${mockProfiles[1].lastName},${mockProfiles[1].email},${mockProfiles[1].phone},${mockProfiles[1].dateOfBirth},${mockProfiles[1].address},${mockProfiles[1].city},ga`;

    const filePath = path.join(tempDir, "valid.csv");
    await fs.writeFile(filePath, csvContent);

    const result = await getProfilesFromCsv(filePath);

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({
      firstName: mockProfiles[0].firstName,
      lastName: mockProfiles[0].lastName,
      email: mockProfiles[0].email,
      phone: mockProfiles[0].phone,
      dateOfBirth: mockProfiles[0].dateOfBirth,
      address: mockProfiles[0].address,
      city: mockProfiles[0].city,
      preferredLanguage: "en",
    });
  });

  it("should skip rows with missing required fields", async () => {
    const csvContent = `firstName,lastName,email,phone
${mockProfiles[0].firstName},${mockProfiles[0].lastName},${mockProfiles[0].email},${mockProfiles[0].phone}
,Smith,jane@example.com,+0987654321
Bob,,bob@example.com,+1122334455
Alice,Johnson,,+9988776655`;

    const filePath = path.join(tempDir, "invalid.csv");
    await fs.writeFile(filePath, csvContent);

    const result = await getProfilesFromCsv(filePath);

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      firstName: mockProfiles[0].firstName,
      lastName: mockProfiles[0].lastName,
      email: mockProfiles[0].email,
      phone: mockProfiles[0].phone,
    });
  });

  it("should normalize CSV values", async () => {
    const csvContent = `firstName,lastName,email,preferredLanguage
  ${mockProfiles[0].firstName}  ,  ${mockProfiles[0].lastName}  ,${mockProfiles[0].email.toUpperCase()},  en  `;

    const filePath = path.join(tempDir, "normalize.csv");
    await fs.writeFile(filePath, csvContent);

    const result = await getProfilesFromCsv(filePath);

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      firstName: mockProfiles[0].firstName,
      lastName: mockProfiles[0].lastName,
      email: mockProfiles[0].email.toUpperCase(),
      preferredLanguage: "en",
      address: undefined,
      city: undefined,
      dateOfBirth: undefined,
      phone: undefined,
    });
  });

  it("should return empty array for empty CSV file", async () => {
    const csvContent = "firstName,lastName,email\n";

    const filePath = path.join(tempDir, "empty.csv");
    await fs.writeFile(filePath, csvContent);

    const result = await getProfilesFromCsv(filePath);

    expect(result).toHaveLength(0);
  });
});

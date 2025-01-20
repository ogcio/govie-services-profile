import os from "os";
import path from "path";
import fs from "fs/promises";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { getProfilesFromCsv } from "../../services/profiles/get-profiles-from-csv.js";

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
John,Doe,john@example.com,+1234567890,1990-01-01,"123 Main St","New York",en
Jane,Smith,jane@example.com,+0987654321,1985-12-31,"456 Oak Ave","Boston",ga`;

    const filePath = path.join(tempDir, "valid.csv");
    await fs.writeFile(filePath, csvContent);

    const result = await getProfilesFromCsv(filePath);

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({
      firstName: "John",
      lastName: "Doe",
      email: "john@example.com",
      phone: "+1234567890",
      dateOfBirth: "1990-01-01",
      address: "123 Main St",
      city: "New York",
      preferredLanguage: "en",
    });
  });

  it("should skip rows with missing required fields", async () => {
    const csvContent = `firstName,lastName,email,phone
John,Doe,john@example.com,+1234567890
,Smith,jane@example.com,+0987654321
Bob,,bob@example.com,+1122334455
Alice,Johnson,,+9988776655`;

    const filePath = path.join(tempDir, "invalid.csv");
    await fs.writeFile(filePath, csvContent);

    const result = await getProfilesFromCsv(filePath);

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      firstName: "John",
      lastName: "Doe",
      email: "john@example.com",
      phone: "+1234567890",
    });
  });

  it("should normalize CSV values", async () => {
    const csvContent = `firstName,lastName,email,preferredLanguage
  John  ,  Doe  ,JOHN@EXAMPLE.COM,  en  `;

    const filePath = path.join(tempDir, "normalize.csv");
    await fs.writeFile(filePath, csvContent);

    const result = await getProfilesFromCsv(filePath);

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      firstName: "John",
      lastName: "Doe",
      email: "JOHN@EXAMPLE.COM",
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

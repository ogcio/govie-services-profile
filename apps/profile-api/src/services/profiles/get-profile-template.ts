import type { KnownProfileDataDetails } from "~/schemas/profiles/index.js";

const templateProfile: KnownProfileDataDetails = {
  firstName: "John",
  lastName: "Doe",
  email: "john.doe@example.com",
  phone: "+353 1234567",
  address: "123 Main Street",
  city: "Dublin",
  dateOfBirth: "1990-01-01",
  ppsn: "1234567T",
  preferredLanguage: "en",
};

const headers = {
  firstName: "First Name (required)",
  lastName: "Last Name (required)",
  email: "Email (required)",
  phone: "Phone Number (optional)",
  address: "Address (optional)",
  city: "City (optional)",
  dateOfBirth: "Date of Birth (YYYY-MM-DD, optional)",
  ppsn: "PPSN (optional)",
  preferredLanguage: "Preferred Language (en or ga, defaults to en)",
};

export const getProfileTemplate = (): Buffer => {
  const csvContent = [
    Object.values(headers).join(","),
    Object.values(templateProfile).join(","),
  ].join("\n");

  return Buffer.from(csvContent, "utf-8");
};

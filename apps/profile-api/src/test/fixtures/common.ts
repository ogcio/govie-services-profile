import { vi } from "vitest";
import type { EnvConfig } from "../../plugins/external/env.js";

// Common mock logger used across tests
export const mockLogger = {
  debug: vi.fn(),
  error: vi.fn(),
  child: vi.fn(),
  level: "info",
  fatal: vi.fn(),
  warn: vi.fn(),
  info: vi.fn(),
  trace: vi.fn(),
  silent: vi.fn(),
};

// Common mock config used in Logto tests
export const mockLogtoConfig = {
  LOGTO_MANAGEMENT_API_ENDPOINT: "http://logto-api",
  LOGTO_MANAGEMENT_API_RESOURCE_URL: "http://logto-resource",
  LOGTO_MANAGEMENT_API_CLIENT_ID: "client-123",
  LOGTO_MANAGEMENT_API_CLIENT_SECRET: "secret-123",
  LOGTO_OIDC_ENDPOINT: "http://logto-oidc",
} as const;

// Common mock API config
export const mockApiConfig: EnvConfig = {
  HOST_URL: "http://api.example.com",
} as EnvConfig;

// Common mock profiles used in tests
export const mockProfiles = [
  {
    email: "john@example.com",
    firstName: "John",
    lastName: "Doe",
    phone: "1234567890",
    dateOfBirth: "1990-01-01",
    address: "123 Test St",
    city: "Test City",
  },
  {
    email: "jane@example.com",
    firstName: "Jane",
    lastName: "Smith",
    phone: "0987654321",
    dateOfBirth: "1991-02-02",
    address: "456 Test Ave",
    city: "Test Town",
  },
];

// Common mock DB profiles
export const mockDbProfiles = [
  {
    id: "profile-123",
    publicName: "Test User 1",
    email: "test1@example.com",
    primaryUserId: "user-123",
    createdAt: "2024-01-15T12:00:00Z",
    updatedAt: "2024-01-15T12:00:00Z",
    preferredLanguage: "en",
    details: {
      firstName: { value: "Test", type: "string" },
      lastName: { value: "User", type: "string" },
      email: { value: "e@mail.com", type: "string" },
      phone: { value: "1234567890", type: "string" },
    },
  },
  {
    id: "profile-456",
    publicName: "Test User 2",
    email: "test2@example.com",
    primaryUserId: "user-456",
    createdAt: "2024-01-15T12:00:00Z",
    updatedAt: "2024-01-15T12:00:00Z",
    preferredLanguage: "en",
    details: {
      firstName: { value: "Another", type: "string" },
      lastName: { value: "User", type: "string" },
      email: { value: "e2@mail.com", type: "string" },
      phone: { value: "0987654321", type: "string" },
    },
  },
];

// Common mock Logto user responses
export const mockLogtoUsers = [
  { id: "user-1", primaryEmail: "john@example.com" },
  { id: "user-2", primaryEmail: "jane@example.com" },
] as const;

// Common mock data for profile details
export const mockProfileDetails = {
  name: "John Doe",
  age: 30,
  active: true,
  birthDate: "2000-01-01T00:00:00.000Z",
  notes: "some notes",
} as const;

// Helper function to transform DB profile to API profile
export const toApiProfile = (dbProfile: (typeof mockDbProfiles)[0]) => ({
  ...dbProfile,
  details: Object.fromEntries(
    Object.entries(dbProfile.details).map(([key, value]) => [key, value.value]),
  ),
});

// Common mock webhook bodies
export const mockWebhookBodies = {
  userCreated: {
    event: "User.Created",
    data: {
      id: "user-123",
      primaryEmail: "test@example.com",
    },
  },
  userUpdated: {
    event: "User.Data.Updated",
    data: {
      id: "user-123",
      primaryEmail: "test@example.com",
    },
  },
} as const;

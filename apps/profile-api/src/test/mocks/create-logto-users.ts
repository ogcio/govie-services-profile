import { vi } from "vitest";

export const mockCreateLogtoUsers = vi.fn().mockResolvedValue([
  { id: "user-1", primaryEmail: "test1@example.com" },
  { id: "user-2", primaryEmail: "test2@example.com" },
]);

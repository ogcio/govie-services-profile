import { defineConfig } from "vitest/config"

export default defineConfig({
  test: {
    environment: "jsdom", // Ensure the testing environment is jsdom (for DOM testing)
    globals: true, // Enable global variables like `describe`, `it`, `expect`
    setupFiles: "./vitest.setup.ts", // Set up global test configuration
    exclude: ["**/node_modules/**", "**/dist/**", "**/e2e/**"],
  },
})

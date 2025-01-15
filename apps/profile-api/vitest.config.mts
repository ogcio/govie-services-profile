import path from "path";
import { defaultExclude, defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    reporters: "default",
    coverage: {
      reporter: ["text"],
      provider: "v8",
      exclude: [...defaultExclude, "src/test/**/*.ts"],
    },
    include: [
      "./src/@(test?(s)|__test?(s)__)/**/*.test.@(js|cjs|mjs|tap|cts|jsx|mts|ts|tsx)",
    ],
    exclude: ["./src/**/@(fixture*(s)|dist|node_modules)/**"],
    maxConcurrency: 1,
    testTimeout: 30000, // Timeout in milliseconds (30 seconds)
    globalSetup: "./src/test/setup-tests.ts",
  },
  resolve: {
    alias: {
      "~": path.resolve(__dirname, "./src"),
    },
  },
});

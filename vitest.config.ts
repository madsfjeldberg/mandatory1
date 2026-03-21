import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: "unit",
          include: ["**/tests/unit/**/*.test.ts"],
        },
      },
      {
        test: {
          name: "integration",
          include: ["**/tests/integration/**/*.test.ts"],
          testTimeout: 60_000, // container spin-up time
          hookTimeout: 60_000, // beforeAll/afterAll also need time
        },
      },
    ],
    // ...
  },
});

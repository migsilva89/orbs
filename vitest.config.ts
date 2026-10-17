import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    projects: ["apps/*", "packages/*"],
    pool: "threads",
    maxWorkers: "100%",
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: ["apps/*/src/**/*.ts", "packages/*/src/**/*.ts"],
      exclude: ["**/paraglide/**", "**/*.d.ts"],
    },
  },
});

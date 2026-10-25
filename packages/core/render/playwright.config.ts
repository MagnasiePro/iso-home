import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  testMatch: "**/*.spec.ts",
  webServer: {
    command: "pnpm --filter @iso-home/playground exec vite --port 5173",
    url: "http://localhost:5173",
    reuseExistingServer: true,
  },
  use: { baseURL: "http://localhost:5173" },
});

import { defineConfig, devices } from "@playwright/test";

/**
 * E2E tests run against a locally-started Next.js dev server. The server
 * reads `.env.local`, which must contain real Supabase credentials for the
 * project. Tests are read-only against seed data plus create+cleanup their
 * own temporary rows so the shared DB stays tidy.
 */

const PORT = 3100;

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false, // serialize; we share one Supabase project
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: process.env.CI ? [["list"], ["junit", { outputFile: "e2e-results.xml" }]] : "list",

  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "on-first-retry",
    video: "retain-on-failure",
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],

  webServer: {
    command: `PORT=${PORT} npx next dev`,
    url: `http://localhost:${PORT}`,
    timeout: 60_000,
    reuseExistingServer: !process.env.CI,
  },
});

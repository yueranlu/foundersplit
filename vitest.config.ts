import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      // server-only is a Next.js runtime marker with no exports. Stub it out
      // so files that import it (queries.ts, auth.ts) can be loaded in a
      // Vitest node environment.
      "server-only": path.resolve(__dirname, "./tests/stubs/server-only.ts"),
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    exclude: ["node_modules", ".next"],
    reporters: process.env.CI ? ["default", "junit"] : ["default"],
    outputFile: { junit: "./test-results.xml" },
  },
});

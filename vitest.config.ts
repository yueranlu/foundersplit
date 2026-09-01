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
    exclude: ["node_modules", ".next", "tests/e2e/**"],
    reporters: process.env.CI ? ["default", "junit"] : ["default"],
    outputFile: { junit: "./test-results.xml" },
    // Files that touch the DOM opt in with a top-of-file
    // `// @vitest-environment jsdom` comment. Everything else runs in node.
    setupFiles: ["./tests/setup-dom.ts"],
  },
});

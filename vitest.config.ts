import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    environment: "node",
    setupFiles: ["./vitest.setup.ts"],
    // Neon's free tier suspends its compute when idle; the first query after
    // a suspend can take several seconds to wake it, well past Vitest's 5s
    // default — these tests hit the real database, not a mock.
    testTimeout: 15000,
  },
});

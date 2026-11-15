import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: { alias: { "@": path.resolve(__dirname, "src") } },
  // Only the game's own tests: not those of the tools cloned under .claude.
  test: { include: ["src/**/*.test.ts"] },
});

import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.js"],
  },
  resolve: {
    // Mirror the jsconfig.json "@/*" path alias so tests import like the app.
    alias: {
      "@": fileURLToPath(new URL(".", import.meta.url)),
    },
  },
});

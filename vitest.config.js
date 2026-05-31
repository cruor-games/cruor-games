import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": __dirname,
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    include: [
      "app/**/*.test.{js,jsx}",
      "features/**/*.test.{js,jsx}",
      "shared/**/*.test.{js,jsx}",
    ],
    exclude: ["node_modules", "dist", "playwright-report", "test-results"],
  },
});

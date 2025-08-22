/// <reference types="vitest/config" />
import react from "@vitejs/plugin-react";
import { defineConfig, AliasOptions } from "vite";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  define: process.env.VITEST ? {} : { global: "window" },
  test: {
    environment: "jsdom",
    exclude: ["**/tests/**", "**/node_modules/**"],
  },
  preview: {
    port: 3000,
  },
  plugins: [react()],
  resolve: {
    alias: {
      "~": path.resolve(__dirname, "./src"),
    } as AliasOptions,
  },
});

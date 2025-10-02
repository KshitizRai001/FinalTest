import { defineConfig, Plugin } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  server: {
    host: "0.0.0.0",
    port: 5000,
  // allowedHosts removed for compatibility
    fs: {
      allow: ["..", "./components", "../shared"],
      deny: [".env", ".env.*", "*.{crt,pem}", "**/.git/**", "server/**"],
    },
  },
  build: {
    outDir: "dist",
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./components"),
      "@shared": path.resolve(__dirname, "../shared"),
    },
  },
});

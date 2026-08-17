import { defineConfig } from "vite";
import react, { reactCompilerPreset } from "@vitejs/plugin-react";
import babel from "@rolldown/plugin-babel";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [
    react(),
    babel({ presets: [reactCompilerPreset()] }),
    // Tailwind v4 integrates as a Vite plugin — no PostCSS config needed
    tailwindcss(),
  ],
  server: {
    port: 5173,
    // Proxy API calls to the Express server during development.
    // This avoids CORS issues and mirrors the production reverse-proxy pattern.
    proxy: {
      "/api": {
        target: "http://localhost:5000",
        changeOrigin: true,
      },
    },
  },
});

import react from "@vitejs/plugin-react";
import tailwind from "tailwindcss";
import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: "./",
  server: {
    port: 5173,
    strictPort: true, // Vite will fail if 5173 is not available
  },
  css: {
    postcss: {
      plugins: [tailwind],
    },
  },
});

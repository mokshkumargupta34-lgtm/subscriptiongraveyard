import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath } from "node:url";

export default defineConfig({
  /* built straight into the Next app's public/ dir, served at /dashboard */
  base: "/dashboard/",
  build: { outDir: "../public/dashboard", emptyOutDir: true },
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
});

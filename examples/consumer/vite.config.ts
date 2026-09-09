import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { spartantThemeScript } from "./theme-script-plugin.js";

export default defineConfig({
  plugins: [react(), tailwindcss(), spartantThemeScript()],
  build: {
    // tsc writes declaration output to dist for the project-reference graph,
    // so the bundle goes somewhere else to avoid clobbering it.
    outDir: "build",
  },
});

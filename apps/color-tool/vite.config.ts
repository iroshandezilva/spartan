import { resolve } from "node:path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      // The colour maths lives in the package's build-time tooling, not in its
      // published surface. This tool is the only other consumer, and both are
      // private, so an alias is preferred over widening the package's public
      // API for a development tool. If a third consumer appears, extract the
      // maths into its own internal workspace package instead.
      "@spartant-color": resolve(import.meta.dirname, "../../packages/spartant/tooling/color"),
    },
  },
  build: { outDir: "build" },
});

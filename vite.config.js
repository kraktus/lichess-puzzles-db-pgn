import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [tailwindcss()],
  optimizeDeps: {
    exclude: ["@bokuweb/zstd-wasm"],
    esbuildOptions: {
      target: "es2020",
    },
  },
});

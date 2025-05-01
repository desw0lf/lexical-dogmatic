import { defineConfig } from "tsdown";
import { buildCss } from "./build-css.js";

export default defineConfig({
  entry: ["./src/index.ts"],
  dts: true,
  platform: "neutral",
  format: "esm",
  // jsx: "automatic", // or "transform" if using classic JSX runtime
  external: ["react", "react-dom"],
  plugins: [
    {
      name: "build-css",
      buildEnd() {
        buildCss();
      },
    },
  ],
})

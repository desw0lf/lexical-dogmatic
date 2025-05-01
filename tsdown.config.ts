import { defineConfig } from "tsdown";

export default defineConfig({
  entry: ["./src/index.ts"],
  dts: true,
  platform: "browser",
  // jsx: "automatic", // or "transform" if using classic JSX runtime
  external: ["react", "react-dom"],
})

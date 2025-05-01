import * as sass from "sass";
import fs from "fs";
import path from "path";

const scssPath = "./src/scss/main.scss";
const outputCssPath = "./dist/css/main.css";

const iconsRoot = path.resolve("./src/icons");

function writeFileSync(filePath, data) {
  const dir = path.dirname(filePath);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(filePath, data, "utf8");
}

export function buildCss() {
  let icons = [];
  const result = sass.compile(scssPath, {
    functions: {
      "svg-encode($filepath)": (filepath) => {
        let relPath = filepath[0] + "";
        if ((relPath.startsWith(`"`) && relPath.endsWith(`"`)) || (relPath.startsWith(`'`) && relPath.endsWith(`'`))) {
          relPath = relPath.slice(1, -1);
        }
        const fullPath = path.resolve(iconsRoot, relPath);
        if (!fs.existsSync(fullPath)) {
          throw new Error(`SVG file not found: ${fullPath}`);
        }
        icons.push(relPath);
        const svgContent = fs.readFileSync(fullPath, "utf-8");
        const base64 = Buffer.from(svgContent).toString("base64");
        return new sass.SassString(`data:image/svg+xml;base64,${base64}`);
      }
    }
  });

  writeFileSync(outputCssPath, result.css);
  console.log(`🟩[CSS] ${icons.length} images encoded`);
  console.log("[" + icons.map((icon) => `\x1b[32m"${icon}"\x1b[0m`).join(", ") + "]");
  console.log(`✅[CSS] ${outputCssPath}`);
}

if (!process.argv[1].includes("tsdown") && !process.argv[1].endsWith("run.js")) {
  buildCss();
}
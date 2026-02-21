// tools/generate-manifest.js
// Generates assets/tole/manifest.json based on images in that folder.

const fs = require("fs");
const path = require("path");

const projectRoot = path.join(__dirname, "..");
const folder = path.join(projectRoot, "assets", "tole");
const outFile = path.join(folder, "manifest.json");

// Allowed image extensions
const exts = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif", ".avif"]);

function naturalSort(a, b) {
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" });
}

function main() {
  if (!fs.existsSync(folder)) {
    console.error(`Folder not found: ${folder}`);
    process.exit(1);
  }

  const files = fs.readdirSync(folder)
    .filter(f => exts.has(path.extname(f).toLowerCase()))
    .sort(naturalSort);

  const manifest = {
    basePath: "./assets/tole/",
    images: files
  };

  fs.writeFileSync(outFile, JSON.stringify(manifest, null, 2), "utf8");
  console.log(`Wrote ${outFile} with ${files.length} images.`);
}

main();
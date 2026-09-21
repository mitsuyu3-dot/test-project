import { cp, mkdir, rm } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const webDir = resolve(projectRoot, "www");
const assets = [
  "index.html",
  "app.js",
  "baccarat-rules.mjs",
  "candidate-geometry.mjs",
  "card-renderer.mjs",
  "squeeze-geometry.mjs",
  "style.css",
  "sw.js",
  "manifest.webmanifest",
  "icon.svg",
];

await rm(webDir, { recursive: true, force: true });
await mkdir(webDir, { recursive: true });

for (const asset of assets) {
  await cp(resolve(projectRoot, asset), resolve(webDir, asset));
}

console.log(`Built ${assets.length} web assets into ${webDir}`);

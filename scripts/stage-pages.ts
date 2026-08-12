import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const artifactRoot = path.join(projectRoot, "_site");

// Everything at repo root EXCEPT these is copied into the deployed artifact.
// Keep this list in sync with .deployignore (documentation only, not enforced).
const DENYLIST = new Set([
  "node_modules",
  ".git",
  ".github",
  "ts",
  "scss",
  "pug",
  "scripts",
  "routes",
  "tests",
  "package.json",
  "package-lock.json",
  "bun.lock",
  "tsconfig.json",
  "tsconfig.build.json",
  ".gitignore",
  ".deployignore",
  "readme.md",
  "_site",
  ".DS_Store",
]);

fs.rmSync(artifactRoot, { recursive: true, force: true });
fs.mkdirSync(artifactRoot, { recursive: true });

for (const entry of fs.readdirSync(projectRoot)) {
  if (DENYLIST.has(entry)) continue;
  const src = path.join(projectRoot, entry);
  const dest = path.join(artifactRoot, entry);
  fs.cpSync(src, dest, { recursive: true });
}

fs.writeFileSync(path.join(artifactRoot, ".nojekyll"), "");

console.log(`GitHub Pages artifact staged at ${artifactRoot}`);

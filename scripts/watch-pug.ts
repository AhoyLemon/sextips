import pug from "pug";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import chokidar from "chokidar";

import routes from "../routes/pug.routes";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");

function compilePugFile(source: string, output: string): boolean {
  try {
    const sourcePath = path.resolve(projectRoot, source);
    const outputPath = path.resolve(projectRoot, output);

    const html = pug.renderFile(sourcePath, {
      pretty: true,
      basedir: path.resolve(projectRoot, "pug"),
    });

    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    fs.writeFileSync(outputPath, html);
    console.log(`${source} -> ${output}`);
    return true;
  } catch (error) {
    if (error instanceof Error) {
      console.error(`Error compiling ${source}:`, error.message);
    } else {
      console.error(`Error compiling ${source}:`, error);
    }
    return false;
  }
}

function rebuildAll(): void {
  Object.entries(routes).forEach(([source, output]) => compilePugFile(source, output));
}

console.log("Watching for changes...");
rebuildAll();

const watcher = chokidar.watch("pug/**/*.pug", { cwd: projectRoot });

watcher.on("change", (changedPath) => {
  const normalized = changedPath.split(path.sep).join("/");
  const basename = path.basename(normalized);

  if (basename.startsWith("_")) {
    rebuildAll();
    return;
  }

  const matchedSource = Object.keys(routes).find((source) => source === normalized);
  if (matchedSource) {
    compilePugFile(matchedSource, routes[matchedSource]);
  } else {
    rebuildAll();
  }
});

watcher.on("add", rebuildAll);
watcher.on("unlink", rebuildAll);

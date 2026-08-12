import pug from "pug";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

import routes from "../routes/pug.routes";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");

function buildPug(): void {
  console.log("Building Pug files...");

  let successCount = 0;
  let errorCount = 0;

  Object.entries(routes).forEach(([source, output]) => {
    try {
      const sourcePath = path.resolve(projectRoot, source);
      const outputPath = path.resolve(projectRoot, output);

      if (!fs.existsSync(sourcePath)) {
        console.error(`Source file not found: ${source}`);
        errorCount++;
        return;
      }

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
      successCount++;
    } catch (error) {
      if (error instanceof Error) {
        console.error(`Error compiling ${source}:`, error.message);
      } else {
        console.error(`Error compiling ${source}:`, error);
      }
      errorCount++;
    }
  });

  console.log(`Build complete: ${successCount} successful, ${errorCount} failed`);

  if (errorCount > 0) {
    process.exit(1);
  }
}

buildPug();

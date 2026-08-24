// Copies the source-of-truth markdown into src/content so it can be bundled
// at build time with a plain `?raw` import. Run before dev/build.
import { copyFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const here = path.dirname(fileURLToPath(import.meta.url));
const source = path.resolve(here, "../../../docs/updates/AgentScore Updates.md");
const destDir = path.resolve(here, "../src/content");
const dest = path.join(destDir, "updates.md");

mkdirSync(destDir, { recursive: true });
copyFileSync(source, dest);

console.log(`Synced ${source} -> ${dest}`);

import fs from "node:fs";
import path from "node:path";
import { APP_ROOT } from "../config.ts";
import { openDb } from "../db.ts";
import { runImport } from "./importer.ts";
import { reconcile } from "./reconcile.ts";

const force = process.argv.includes("--force");
const dbArg = process.argv.find((a) => a.startsWith("--db="))?.slice(5);

try {
  const result = runImport({ force, dbPath: dbArg });
  const { markdown, failures } = reconcile(openDb(result.dbPath), result);
  const dir = path.join(APP_ROOT, "reports");
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, `reconciliation-${new Date().toISOString().slice(0, 10)}.md`);
  fs.writeFileSync(file, markdown);
  console.log(markdown);
  console.log(`\nReport written to ${file}`);
  process.exitCode = failures ? 1 : 0;
} catch (e) {
  console.error((e as Error).message);
  process.exitCode = 2;
}

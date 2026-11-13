import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import { APP_ROOT, DB_PATH } from "./config.ts";

export type DB = Database.Database;

let instance: DB | null = null;

export function openDb(file: string = DB_PATH): DB {
  if (instance && instance.name === file) return instance;
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const db = new Database(file);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  migrate(db);
  instance = db;
  return db;
}

function migrate(db: DB) {
  db.exec("CREATE TABLE IF NOT EXISTS schema_migration (name TEXT PRIMARY KEY, applied_at TEXT NOT NULL)");
  const dir = path.join(APP_ROOT, "src", "migrations");
  const applied = new Set(
    db.prepare("SELECT name FROM schema_migration").all().map((r) => (r as { name: string }).name),
  );
  for (const file of fs.readdirSync(dir).filter((f) => f.endsWith(".sql")).sort()) {
    if (applied.has(file)) continue;
    db.transaction(() => {
      db.exec(fs.readFileSync(path.join(dir, file), "utf8"));
      db.prepare("INSERT INTO schema_migration VALUES (?, ?)").run(file, new Date().toISOString());
    })();
  }
}

export function one<T>(db: DB, sql: string, ...params: unknown[]): T | undefined {
  return db.prepare(sql).get(...params) as T | undefined;
}

export function all<T>(db: DB, sql: string, ...params: unknown[]): T[] {
  return db.prepare(sql).all(...params) as T[];
}

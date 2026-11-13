import fs from "node:fs";
import { AUDIT_LOG_PATH } from "./config.ts";

export type AuditMention = { entry: string; lines: string[] };

type Entry = { heading: string; lines: string[] };

let cache: { mtime: number; entries: Entry[] } | null = null;

function entries(file = AUDIT_LOG_PATH): Entry[] {
  if (!fs.existsSync(file)) return [];
  const mtime = fs.statSync(file).mtimeMs;
  if (cache && cache.mtime === mtime) return cache.entries;
  const out: Entry[] = [];
  let cur: Entry | null = null;
  for (const line of fs.readFileSync(file, "utf8").split("\n")) {
    if (line.startsWith("## ")) {
      cur = { heading: line.slice(3).trim(), lines: [] };
      out.push(cur);
    } else if (cur && line.trim()) cur.lines.push(line);
  }
  cache = { mtime, entries: out };
  return out;
}

/** Audit-log lines that mention any of the names. Short names need a word boundary to count. */
export function mentions(names: string[], file = AUDIT_LOG_PATH): AuditMention[] {
  const patterns = [...new Set(names.filter((n) => n.trim().length >= 3))].map(
    (n) => new RegExp(`(^|[^A-Za-z0-9])${n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?![A-Za-z0-9])`, "i"),
  );
  const out: AuditMention[] = [];
  for (const e of entries(file)) {
    const lines = e.lines.filter((l) => patterns.some((p) => p.test(l)));
    if (lines.length) out.push({ entry: e.heading, lines });
  }
  return out;
}

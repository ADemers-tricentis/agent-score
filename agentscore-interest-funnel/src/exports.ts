import fs from "node:fs";
import path from "node:path";
import { APP_ROOT, MAIL_MERGE_PATH } from "./config.ts";
import { all, type DB } from "./db.ts";
import { currentStages } from "./queries.ts";

export type MailMergeRow = { company: string; name: string; email: string; status: string };

const quote = (s: string) => `"${s.replace(/"/g, '""')}"`;

/**
 * Same file the sync agent used to write: header Company,Name,Email,Status, every field quoted,
 * one row per company (its primary contact). `runId` limits it to companies a sync run added.
 */
export function mailMergeRows(db: DB, opts: { runId?: number; allUnemailed?: boolean }): { rows: MailMergeRow[]; skipped: string[] } {
  const current = new Map(currentStages(db).map((r) => [r.company_id, r.stage]));
  const companies = opts.runId
    ? all<{ id: number; name: string; primary_person_id: number | null }>(
        db,
        `SELECT DISTINCT c.id, c.name, c.primary_person_id FROM company c JOIN submission s ON s.company_id = c.id
         WHERE s.run_id = ? AND s.disposition = 'counted' AND c.merged_into_id IS NULL AND c.excluded_reason IS NULL ORDER BY c.id`,
        opts.runId,
      )
    : all<{ id: number; name: string; primary_person_id: number | null }>(
        db,
        "SELECT id, name, primary_person_id FROM company WHERE merged_into_id IS NULL AND excluded_reason IS NULL ORDER BY id",
      );
  const rows: MailMergeRow[] = [];
  const skipped: string[] = [];
  for (const c of companies) {
    if (current.get(c.id) !== "interested") {
      if (opts.runId) skipped.push(`${c.name}: already past Interested`);
      continue;
    }
    const people = all<{ id: number; name: string; email: string | null; dne: string | null }>(
      db,
      `SELECT p.id, p.name, p.email, p.do_not_email_reason AS dne FROM contact ct JOIN person p ON p.id = ct.person_id
       WHERE ct.company_id = ? AND ct.role = 'submitter' AND ct.outreach_excluded_reason IS NULL
       ORDER BY CASE WHEN p.id = ? THEN 0 ELSE 1 END, ct.id`,
      c.id,
      c.primary_person_id ?? -1,
    );
    const pick = people.find((p) => p.email && !p.dne);
    if (!pick) {
      skipped.push(`${c.name}: no contact with an email who can be emailed`);
      continue;
    }
    rows.push({ company: c.name, name: pick.name, email: pick.email!, status: "Interested" });
  }
  return { rows, skipped };
}

export function mailMergeCsv(rows: MailMergeRow[]): string {
  return [
    ["Company", "Name", "Email", "Status"].map(quote).join(","),
    ...rows.map((r) => [r.company, r.name, r.email, r.status].map(quote).join(",")),
  ].join("\n") + "\n";
}

export function writeMailMerge(db: DB, opts: { runId?: number; allUnemailed?: boolean; out?: string }) {
  const { rows, skipped } = mailMergeRows(db, opts);
  const file = opts.out ?? MAIL_MERGE_PATH;
  fs.writeFileSync(file, mailMergeCsv(rows));
  return { file, rows: rows.length, companies: rows.map((r) => r.company), skipped };
}

export async function backup(db: DB, dir = path.join(APP_ROOT, "backups")): Promise<string> {
  fs.mkdirSync(dir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const file = path.join(dir, `funnel-${stamp}.db`);
  await db.backup(file);
  return file;
}

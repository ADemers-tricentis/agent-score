import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const APP_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const envFile = path.join(APP_ROOT, ".env");
if (fs.existsSync(envFile))
  for (const line of fs.readFileSync(envFile, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*?)\s*$/);
    if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }

export const REPO = process.env.AGENTSCORE_REPO ?? path.resolve(APP_ROOT, "..");

export const DB_PATH = process.env.FUNNEL_DB ?? path.join(APP_ROOT, "data", "funnel.db");

export const PORT = Number(process.env.PORT ?? 4310);

export const FEEDBACK_DIR = path.join(REPO, "docs", "feedback");

export const SOURCES = {
  tracker: path.join(FEEDBACK_DIR, "External Interest.md"),
  contactsCsv: path.join(FEEDBACK_DIR, "email automation", "external-interest-contacts.csv"),
  oneEmailFollowupCsv: path.join(FEEDBACK_DIR, "email automation", "external-interest-one-email-followup.csv"),
  noResponseFollowupCsv: path.join(FEEDBACK_DIR, "email automation", "external-interest-no-response-followup.csv"),
  betaCohorts: path.join(FEEDBACK_DIR, "Beta Cohorts.md"),
  fitHtml: path.join(FEEDBACK_DIR, "AgentScore-interest-fit.html"),
  lastProcessed: path.join(REPO, ".claude", "skills", "external-interest-sync", ".last-processed"),
  lastReplyCheck: path.join(REPO, ".claude", "skills", "external-interest-sync", ".last-reply-check"),
};

export const AUDIT_LOG_PATH = process.env.FUNNEL_AUDIT_LOG ?? path.join(FEEDBACK_DIR, "External Interest Audit Log.md");

export const MAIL_MERGE_PATH =
  process.env.FUNNEL_MAIL_MERGE ?? path.join(FEEDBACK_DIR, "email automation", "external-interest-mail-merge.csv");

// The snapshot only takes over the tracker's name once the original md is archived.
export const SNAPSHOT_PATH =
  process.env.FUNNEL_SNAPSHOT ?? path.join(FEEDBACK_DIR, "External Interest (generated).md");

export const INTERNAL_DOMAINS = ["tricentis.com"];

export const OWNED_BRAND_DOMAINS = ["neotys.com"];

export const PLACEHOLDER_OWNERS = ["Tricentis Bulldog"];

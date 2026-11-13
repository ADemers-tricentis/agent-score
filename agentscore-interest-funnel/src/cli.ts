import fs from "node:fs";
import path from "node:path";
import { APP_ROOT, AUDIT_LOG_PATH, DB_PATH, MAIL_MERGE_PATH, SNAPSHOT_PATH } from "./config.ts";
import { all, one, openDb } from "./db.ts";
import { backup, writeMailMerge } from "./exports.ts";
import { matchSubmission } from "./match.ts";
import { CURRENT_STAGE_SQL, funnelCounts } from "./queries.ts";
import { companyByIdOrName, leads, ownerText } from "./read.ts";
import {
  addCompanyLink,
  addCompanyNote,
  createCompany,
  ensureContact,
  addResearch,
  addSubmission,
  addTouchpoint,
  currentStage,
  findPersonByEmail,
  getState,
  moveStage,
  recordFirstSignin,
  RuleError,
  setDoNotEmail,
  setSalesforce,
  setState,
  type Actor,
  type Ctx,
  type SubmissionInput,
} from "./services.ts";
import { writeSnapshot } from "./snapshot.ts";

const HELP = `funnel <command> [options]   (JSON on stdout; errors as JSON on stderr, exit 1)

Global: --actor sync-agent|cli   --run <id>   --no-snapshot
bin/funnel --dryrun <command> ...   runs against the copies made by "dryrun prepare" (DB, audit log, exports)

Runs and markers
  run start --kind labs_sync|reply_check|reconciliation|manual [--dry-run]
  run finish <id> --status ok|partial|failed [--summary-file <md>]
  marker get last_processed|last_reply_check         also returns "fallback" for when the marker is empty
  marker set <key> <ISO timestamp>                    (needs --run)
  changes --run <id>                                  change-log rows written by a run

Lookups
  match --name <n> --email <e> [--company <form company field>]
  company find <text>
  company show <id|name>
  contacts --status email_sent,follow_up_sent[,interested] [--with-email]
  report                                              funnel counts

Writes (all need --run when --actor sync-agent)
  submission add --json <file|->                      counted | stacked | repeat | excluded | held
  research add --company <id> --field <what_they_do|likely_use_case|known_agent_tooling|...>
               --body <text|@file> [--source <url> ...] [--label <raw label>]
  salesforce set --company <id> --json <file|->       {"status": "...", "accounts": [...], "note": "..."}
  touchpoint add --company <id> [--person <email|id>] --kind <intro_email|follow_up|reply_received|our_reply|
               demo_scheduled|beta_invite|beta_checkin|opt_out|other> [--date YYYY-MM-DD] --source <inbox|sent_items|manual> [--note <t>]
  stage set --company <id> --stage <id> [--date] [--note] [--reason]
  signin add --company <id> [--person <email|id>] --date YYYY-MM-DD [--kind product_login|reported_use] [--note]
  note add --company <id> --body <text>
  person dne --person <email|id> --date YYYY-MM-DD --reason <text>
  company add --name <name> --source sales|referral|form [--detail <text>] [--date YYYY-MM-DD]
  contact add --company <id> --name <n> [--email <e>] [--role demo_contact|submitter|other]
  link add --company <id> --path <repo path or URL> [--kind feedback_session|doc|other] [--label <text>]

Exports and maintenance
  export mail-merge (--run <id> | --all-unemailed) [--out <file>]
  export snapshot [--out <file>]
  backup [--dir <dir>]
  paths                                               resolved DB, audit log, mail-merge and snapshot paths
  dryrun prepare                                      copy the DB and audit log to data/dryrun/ and print the env to use
`;

type Args = { _: string[]; flags: Record<string, string[]> };

function parse(argv: string[]): Args {
  const out: Args = { _: [], flags: {} };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith("--")) {
      const [k, v] = a.slice(2).split(/=(.*)/s);
      const next = argv[i + 1];
      const value = v !== undefined ? v : next !== undefined && !next.startsWith("--") ? (i++, next) : "true";
      (out.flags[k] ??= []).push(value);
    } else out._.push(a);
  }
  return out;
}

const flag = (a: Args, k: string) => a.flags[k]?.[0];
const need = (a: Args, k: string) => {
  const v = flag(a, k);
  if (v === undefined || v === "true") throw new RuleError("missing_flag", `--${k} is required`);
  return v;
};
const readInput = (v: string) => (v === "-" ? fs.readFileSync(0, "utf8") : v.startsWith("@") || fs.existsSync(v) ? fs.readFileSync(v.replace(/^@/, ""), "utf8") : v);
const text = (v: string) => (v.startsWith("@") ? fs.readFileSync(v.slice(1), "utf8").trim() : v);

function main(argv: string[]) {
  const a = parse(argv);
  const [cmd, sub, ...rest] = a._;
  if (!cmd || cmd === "help" || a.flags.help) return { help: HELP };
  const db = openDb();
  const actor = (flag(a, "actor") ?? "cli") as Actor;
  if (actor !== "cli" && actor !== "sync-agent") throw new RuleError("bad_actor", "--actor must be cli or sync-agent");
  const runFlag = flag(a, "run");
  const runId = runFlag ? Number(runFlag) : null;
  const ctx: Ctx = { db, actor, runId };
  const isWrite =
    ["submission", "research", "salesforce", "touchpoint", "stage", "signin", "note", "person", "contact", "link"].includes(cmd) ||
    (cmd === "marker" && sub === "set") ||
    (cmd === "company" && sub === "add");
  if (isWrite && actor === "sync-agent" && !runId) throw new RuleError("run_required", "The sync agent must pass --run <id> on every write");
  if (runId && !one(db, "SELECT 1 FROM sync_run WHERE id = ?", runId)) throw new RuleError("not_found", `No run ${runId}`);

  const company = (key: string) => {
    const c = companyByIdOrName(db, key);
    if (!c) throw new RuleError("not_found", `No company "${key}"`);
    return c;
  };
  const person = (key: string | undefined) => {
    if (!key) return null;
    if (/^\d+$/.test(key)) return Number(key);
    const p = findPersonByEmail(db, key);
    if (!p) throw new RuleError("not_found", `No person with email ${key}`);
    return p.id;
  };

  const write = <T>(fn: () => T) => {
    const result = db.transaction(fn)();
    const snapshot = a.flags["no-snapshot"] ? null : writeSnapshot(db);
    return { ...(result as object), snapshot };
  };

  switch (cmd) {
    case "paths":
      return { db: DB_PATH, audit_log: AUDIT_LOG_PATH, mail_merge: MAIL_MERGE_PATH, snapshot: SNAPSHOT_PATH, app: APP_ROOT };

    case "dryrun": {
      if (sub !== "prepare") break;
      const dir = path.join(APP_ROOT, "data", "dryrun");
      fs.mkdirSync(dir, { recursive: true });
      const dbCopy = path.join(dir, "funnel.db");
      for (const s of ["", "-wal", "-shm"]) fs.rmSync(dbCopy + s, { force: true });
      db.pragma("wal_checkpoint(TRUNCATE)");
      fs.copyFileSync(DB_PATH, dbCopy);
      const audit = path.join(dir, "External Interest Audit Log.md");
      fs.copyFileSync(AUDIT_LOG_PATH, audit);
      const env = {
        FUNNEL_DB: dbCopy,
        FUNNEL_AUDIT_LOG: audit,
        FUNNEL_MAIL_MERGE: path.join(dir, "external-interest-mail-merge.csv"),
        FUNNEL_SNAPSHOT: path.join(dir, "External Interest (generated).md"),
      };
      return { env, export: Object.entries(env).map(([k, v]) => `export ${k}="${v}"`).join("\n") };
    }

    case "run": {
      if (sub === "start") {
        const kind = need(a, "kind");
        const dry = a.flags["dry-run"] ? 1 : 0;
        const info = db
          .prepare("INSERT INTO sync_run (kind, dry_run, actor, cutoff_before, reply_cutoff_before) VALUES (?, ?, ?, ?, ?)")
          .run(kind, dry, actor, getState(db, "last_processed"), getState(db, "last_reply_check"));
        return { run_id: Number(info.lastInsertRowid), dry_run: !!dry, db: DB_PATH, last_processed: getState(db, "last_processed"), last_reply_check: getState(db, "last_reply_check") };
      }
      if (sub === "finish") {
        const id = Number(rest[0] ?? runFlag);
        const summary = flag(a, "summary-file") ? fs.readFileSync(need(a, "summary-file"), "utf8") : null;
        db.prepare(
          "UPDATE sync_run SET status = ?, finished_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now'), summary_md = ?, cutoff_after = ?, reply_cutoff_after = ? WHERE id = ?",
        ).run(need(a, "status"), summary, getState(db, "last_processed"), getState(db, "last_reply_check"), id);
        return { run_id: id, status: flag(a, "status") };
      }
      break;
    }

    case "marker": {
      const k = rest[0];
      if (sub !== "get" && sub !== "set") break;
      if (!k || !["last_processed", "last_reply_check"].includes(k)) throw new RuleError("bad_key", "marker key must be last_processed or last_reply_check");
      if (sub === "get") {
        const fallback =
          k === "last_processed"
            ? one<{ d: string | null }>(db, "SELECT max(submitted_at) AS d FROM submission WHERE source = 'labs_form' AND submitted_at IS NOT NULL")?.d
            : one<{ d: string | null }>(
                db,
                `SELECT min(t.occurred_on) AS d FROM touchpoint t
                 WHERE t.kind = 'intro_email' AND t.company_id IN (SELECT company_id FROM (${CURRENT_STAGE_SQL}) WHERE stage IN ('email_sent', 'follow_up_sent'))`,
              )?.d;
        return { [k]: getState(db, k), fallback: fallback ?? null };
      }
      const value = rest[1];
      if (!value || Number.isNaN(Date.parse(value))) throw new RuleError("bad_value", "marker value must be an ISO-8601 timestamp");
      db.transaction(() => setState(ctx, k, value))();
      return { [k]: value };
    }

    case "changes":
      return {
        changes: all(db, "SELECT at, actor, entity, entity_id, company_id, (SELECT name FROM company WHERE id = company_id) AS company, action, before_json, after_json, reason FROM change_log WHERE run_id = ? ORDER BY id", Number(need(a, "run"))),
      };

    case "match":
      return matchSubmission(db, { name: need(a, "name"), email: flag(a, "email"), company: flag(a, "company") });

    case "company": {
      if (sub === "find") {
        const q = `%${rest.join(" ").toLowerCase()}%`;
        return {
          companies: all(db, "SELECT DISTINCT c.id, c.name FROM company c JOIN company_alias a ON a.company_id = c.id WHERE c.merged_into_id IS NULL AND (lower(a.alias) LIKE ? OR lower(c.name) LIKE ?) ORDER BY c.name", q, q).map((c) => {
            const row = c as { id: number; name: string };
            return { ...row, stage: currentStage(db, row.id)?.stage ?? null };
          }),
        };
      }
      if (sub === "add") {
        const source = (flag(a, "source") ?? "sales") as "form" | "sales" | "referral";
        if (!["form", "sales", "referral"].includes(source)) throw new RuleError("bad_source", "--source must be form, sales or referral");
        return write(() => ({ company_id: createCompany(ctx, { name: need(a, "name"), source, sourceDetail: flag(a, "detail") ?? null, firstSeen: flag(a, "date") ?? null }) }));
      }
      if (sub === "show") {
        const c = company(rest.join(" "));
        const l = leads(db, { includeInactive: true }).find((x) => x.id === c.id)!;
        return {
          id: c.id,
          name: c.name,
          stage: l.stage,
          stage_on: l.stage_on,
          owner: ownerText(l),
          sf_lookup_status: l.sf_lookup_status,
          fit: l.bucket,
          aliases: all(db, "SELECT alias FROM company_alias WHERE company_id = ?", c.id).map((x) => (x as { alias: string }).alias),
          contacts: all(
            db,
            "SELECT p.id, p.name, p.email, ct.role, ct.status, p.do_not_email_reason IS NOT NULL AS do_not_email, ct.outreach_excluded_reason FROM contact ct JOIN person p ON p.id = ct.person_id WHERE ct.company_id = ?",
            c.id,
          ),
          touchpoints: all(db, "SELECT t.kind, t.occurred_on, p.name AS person, t.source FROM touchpoint t LEFT JOIN person p ON p.id = t.person_id WHERE t.company_id = ? ORDER BY t.occurred_on", c.id),
          research_fields: all(db, "SELECT id, field, label_raw FROM research_field WHERE company_id = ? ORDER BY sort", c.id),
        };
      }
      break;
    }

    case "contacts": {
      const statuses = (flag(a, "status") ?? "interested,email_sent,follow_up_sent").split(",");
      const rows = all<{ company_id: number; company: string; person_id: number; name: string; email: string | null; contact_status: string; dne: number; excluded: string | null }>(
        db,
        `SELECT c.id AS company_id, c.name AS company, p.id AS person_id, p.name, p.email, ct.status AS contact_status,
                p.do_not_email_reason IS NOT NULL AS dne, ct.outreach_excluded_reason AS excluded
         FROM contact ct JOIN person p ON p.id = ct.person_id JOIN company c ON c.id = ct.company_id
         WHERE c.merged_into_id IS NULL AND c.excluded_reason IS NULL AND ct.status IN (${statuses.map(() => "?").join(",")})`,
        ...statuses,
      ).filter((r) => !r.dne && !r.excluded && (!a.flags["with-email"] || r.email));
      return { contacts: rows.map((r) => ({ ...r, company_stage: currentStage(db, r.company_id)?.stage ?? null })) };
    }

    case "report":
      return funnelCounts(db);

    case "submission": {
      if (sub !== "add") break;
      const input = JSON.parse(readInput(need(a, "json"))) as SubmissionInput | SubmissionInput[];
      return write(() => ({ results: (Array.isArray(input) ? input : [input]).map((s) => addSubmission(ctx, s)) }));
    }

    case "research": {
      if (sub !== "add") break;
      const field = need(a, "field");
      const body = text(need(a, "body"));
      const sources = (a.flags.source ?? []).map((url) => ({ url }));
      if (["what_they_do", "known_agent_tooling"].includes(field) && !sources.length && !/no public information found/i.test(body))
        throw new RuleError("source_required", `${field} needs at least one --source URL, or must say "no public information found"`);
      const c = company(need(a, "company"));
      return write(() => ({ research_field_id: addResearch(ctx, { companyId: c.id, field, labelRaw: flag(a, "label"), body, sources }) }));
    }

    case "salesforce": {
      if (sub !== "set") break;
      const c = company(need(a, "company"));
      const input = JSON.parse(readInput(need(a, "json")));
      return write(() => (setSalesforce(ctx, { companyId: c.id, status: input.status, accounts: input.accounts, note: input.note }), { company_id: c.id }));
    }

    case "touchpoint": {
      if (sub !== "add") break;
      const c = company(need(a, "company"));
      return write(() =>
        addTouchpoint(ctx, { companyId: c.id, personId: person(flag(a, "person")), kind: need(a, "kind"), occurredOn: flag(a, "date") ?? null, source: need(a, "source"), note: flag(a, "note") ?? null }),
      );
    }

    case "stage": {
      if (sub !== "set") break;
      const c = company(need(a, "company"));
      return write(() => moveStage(ctx, { companyId: c.id, stage: need(a, "stage"), occurredOn: flag(a, "date") ?? null, note: flag(a, "note") ?? null, reason: flag(a, "reason") ?? null }));
    }

    case "signin": {
      if (sub !== "add") break;
      const c = company(need(a, "company"));
      const kind = (flag(a, "kind") ?? "product_login") as "product_login" | "reported_use";
      return write(() => recordFirstSignin(ctx, { companyId: c.id, personId: person(flag(a, "person")), signedInOn: need(a, "date"), kind, note: flag(a, "note") ?? null }));
    }

    case "note": {
      if (sub !== "add") break;
      const c = company(need(a, "company"));
      return write(() => (addCompanyNote(ctx, { companyId: c.id, body: text(need(a, "body")) }), { company_id: c.id }));
    }

    case "contact": {
      if (sub !== "add") break;
      const c = company(need(a, "company"));
      const role = (flag(a, "role") ?? "demo_contact") as "submitter" | "demo_contact" | "other";
      return write(() => ({ company_id: c.id, person_id: ensureContact(ctx, { companyId: c.id, name: need(a, "name"), email: flag(a, "email") ?? null, role }) }));
    }

    case "link": {
      if (sub !== "add") break;
      const c = company(need(a, "company"));
      return write(() => addCompanyLink(ctx, { companyId: c.id, kind: flag(a, "kind") ?? "feedback_session", label: flag(a, "label") ?? null, pathOrUrl: need(a, "path") }));
    }

    case "person": {
      if (sub !== "dne") break;
      const pid = person(need(a, "person"))!;
      return write(() => (setDoNotEmail(ctx, { personId: pid, on: need(a, "date"), reason: need(a, "reason") }), { person_id: pid }));
    }

    case "export": {
      if (sub === "mail-merge") {
        if (!runId && !a.flags["all-unemailed"]) throw new RuleError("missing_flag", "pass --run <id> or --all-unemailed");
        return writeMailMerge(db, { runId: runId ?? undefined, allUnemailed: !!a.flags["all-unemailed"], out: flag(a, "out") });
      }
      if (sub === "snapshot") return { snapshot: writeSnapshot(db, flag(a, "out")) };
      break;
    }

    case "backup":
      return backup(db, flag(a, "dir")).then((file) => ({ backup: file }));
  }
  throw new RuleError("unknown_command", `Unknown command "${a._.join(" ")}". Run "funnel help".`);
}

try {
  const out = await main(process.argv.slice(2));
  if (out && typeof out === "object" && "help" in out) process.stdout.write(String(out.help));
  else process.stdout.write(JSON.stringify(out, null, 2) + "\n");
} catch (e) {
  const err = e as RuleError;
  process.stderr.write(JSON.stringify({ error: err.message, code: err.code ?? "error" }) + "\n");
  process.exitCode = 1;
}

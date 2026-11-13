import Database from "better-sqlite3";
import fs from "node:fs";
import { DB_PATH, SOURCES } from "../config.ts";
import { all, one, openDb, type DB } from "../db.ts";
import { logChange, type Ctx } from "../services.ts";
import { FUNNEL_STAGES, isExit, parseStageLabel, stageIndex, type Stage } from "../stages.ts";
import aliasesJson from "./aliases.json" with { type: "json" };
import exclusionsJson from "./exclusions.json" with { type: "json" };
import { parseCohorts, type CohortsDoc } from "./cohorts.ts";
import { parseFitHtml, type FitDoc } from "./fit.ts";
import { parseOwnerLine } from "./salesforce.ts";
import { csvObjects, extractLinks, isoDate, normalizeName, splitTopLevel, usDate } from "./text.ts";
import { parseTracker, type Section, type Tracker } from "./tracker.ts";

export type Issue = {
  kind: "unparsed" | "conflict" | "unmatched" | "prefix_match" | "note";
  source: string;
  line?: number;
  message: string;
};

export type ImportResult = {
  dbPath: string;
  issues: Issue[];
  tracker: Tracker;
  cohorts: CohortsDoc;
  fit: FitDoc;
  contactsCsv: Record<string, string>[];
  contactsMatched: number;
};

const CSV_NAME = "external-interest-contacts.csv";
const TRACKER = "External Interest.md";

class Resolver {
  private byKey = new Map<string, number>();
  private names = new Map<number, string>();
  constructor(private issues: Issue[]) {}
  add(name: string, id: number) {
    const k = normalizeName(name);
    if (!k) return;
    const existing = this.byKey.get(k);
    if (existing !== undefined && existing !== id) return;
    this.byKey.set(k, id);
    if (!this.names.has(id)) this.names.set(id, name);
  }
  resolve(name: string, source: string, line?: number): number | null {
    const k = normalizeName(name);
    const exact = this.byKey.get(k);
    if (exact !== undefined) return exact;
    const hits = [...new Set([...this.byKey.entries()].filter(([key]) => key.startsWith(k) && k.length >= 2).map(([, id]) => id))];
    if (hits.length === 1) {
      this.issues.push({ kind: "prefix_match", source, line, message: `"${name}" -> ${this.names.get(hits[0])}` });
      this.byKey.set(k, hits[0]);
      return hits[0];
    }
    this.issues.push({
      kind: "unmatched",
      source,
      line,
      message: hits.length ? `"${name}" is ambiguous (${hits.map((h) => this.names.get(h)).join(" | ")})` : `"${name}" matches no company`,
    });
    return null;
  }
}

function hasNonImportChanges(file: string): boolean {
  if (!fs.existsSync(file)) return false;
  const db = new Database(file, { readonly: true });
  try {
    const t = db.prepare("SELECT 1 FROM sqlite_master WHERE name = 'change_log'").get();
    if (!t) return false;
    return !!db.prepare("SELECT 1 FROM change_log WHERE actor <> 'import' LIMIT 1").get();
  } finally {
    db.close();
  }
}

function personName(raw: string | undefined): string | null {
  if (!raw) return null;
  const t = raw.trim();
  if (/^[—-]/.test(t)) return null;
  return t.replace(/\s*\([^)]*\)\s*$/, "").trim();
}

/** "Juralak Panpreeda (form company: AIS/Mimo Tech)" -> "form company: AIS/Mimo Tech" */
function nameNote(raw: string | undefined): string | null {
  return raw?.match(/\(([^)]*)\)\s*$/)?.[1] ?? null;
}

function field(section: Section, label: string) {
  return section.fields.find((f) => f.label === label);
}

function dateField(section: Section, label: string): { date: string | null; rest: string; line?: number } {
  const f = field(section, label);
  if (!f) return { date: null, rest: "" };
  const date = isoDate(f.value);
  return { date, rest: f.value.replace(/^\s*\d{4}-\d{2}-\d{2}\.?\s*/, "").trim(), line: f.line };
}

function namesInParens(rest: string): string[] {
  const m = rest.match(/^\((.*)\)$/);
  if (!m) return [];
  return m[1].split(/,\s*|\s+and\s+/).map((n) => n.trim()).filter(Boolean);
}

const PARAGRAPH_FIELD: Record<string, string> = {
  "what they do": "what_they_do",
  "likely use case": "likely_use_case",
  "known agent tooling": "known_agent_tooling",
  "confirmed use case": "confirmed_use_case",
  "waiting on": "waiting_on",
  outreach: "outreach",
  "agent stack": "agent_stack",
  "beta evaluation status": "beta_evaluation_status",
  source: "sales_source",
  "not a fit": "exit_note",
  responded: "responded",
};

export function runImport(opts: { dbPath?: string; force?: boolean } = {}): ImportResult {
  const dbPath = opts.dbPath ?? DB_PATH;
  if (hasNonImportChanges(dbPath) && !opts.force)
    throw new Error(
      `${dbPath} has changes made in the app or by the sync agent. Re-importing would discard them. Back up the DB and pass --force to import anyway.`,
    );
  for (const suffix of ["", "-wal", "-shm"]) fs.rmSync(dbPath + suffix, { force: true });

  const db = openDb(dbPath);
  const issues: Issue[] = [];
  const tracker = parseTracker(fs.readFileSync(SOURCES.tracker, "utf8"));
  const contactsCsv = csvObjects(fs.readFileSync(SOURCES.contactsCsv, "utf8"));
  const cohortsDoc = parseCohorts(fs.readFileSync(SOURCES.betaCohorts, "utf8"));
  const fitDoc = parseFitHtml(fs.readFileSync(SOURCES.fitHtml, "utf8"));
  let contactsMatched = 0;

  db.transaction(() => {
    const run = db.prepare("INSERT INTO sync_run (kind, actor, status) VALUES ('import', 'import', 'running')").run();
    const ctx: Ctx = { db, actor: "import", runId: Number(run.lastInsertRowid) };
    const resolver = new Resolver(issues);
    const rename = aliasesJson.rename as Record<string, string>;

    // Reference data
    fitDoc.payload.buckets.forEach((b, i) =>
      db
        .prepare("INSERT INTO fit_bucket (id, label, short_label, tone, sort) VALUES (?, ?, ?, ?, ?)")
        .run(b.id, b.label, fitDoc.payload.label[b.id] ?? b.label, fitDoc.payload.tone[b.id] ?? "neutral", i),
    );
    tracker.agentStacks.forEach((s, i) => db.prepare("INSERT INTO agent_stack (name, sort) VALUES (?, ?)").run(s.stack, i));

    // Companies
    const sectionCompany = new Map<Section, number>();
    for (const s of tracker.sections) {
      const name = rename[s.heading] ?? s.heading;
      const first = s.groups[0];
      let source: "form" | "sales" | "referral" = "form";
      let sourceDetail: string | null = null;
      if (first && /Sales conversation/i.test(first.dateRaw)) {
        source = "sales";
        sourceDetail = first.name?.match(/via Sales(?: rep)?:?\s*([^);]+)/i)?.[1]?.trim() ?? null;
        sourceDetail = sourceDetail ? `via Sales: ${sourceDetail}` : "via Sales";
      } else if (first && /sourced via/i.test(first.dateRaw)) {
        source = "referral";
        sourceDetail = first.dateRaw.replace(/^\(|\)$/g, "").replace(/\s*—\s*not a Labs form submission/i, "");
      }
      const info = db
        .prepare("INSERT INTO company (name, source, source_detail, import_raw_md) VALUES (?, ?, ?, ?)")
        .run(name, source, sourceDetail, s.raw);
      const id = Number(info.lastInsertRowid);
      sectionCompany.set(s, id);
      for (const alias of new Set([name, s.heading])) {
        db.prepare("INSERT OR IGNORE INTO company_alias (company_id, alias, origin) VALUES (?, ?, 'tracker')").run(id, alias);
        resolver.add(alias, id);
      }
    }
    for (const [canonical, list] of Object.entries(aliasesJson.aliases as Record<string, string[]>)) {
      const id = one<{ id: number }>(db, "SELECT id FROM company WHERE name = ?", canonical)?.id;
      if (!id) {
        issues.push({ kind: "unmatched", source: "aliases.json", message: `alias target "${canonical}" is not a company` });
        continue;
      }
      for (const alias of list) {
        db.prepare("INSERT OR IGNORE INTO company_alias (company_id, alias, origin) VALUES (?, ?, 'aliases.json')").run(id, alias);
        resolver.add(alias, id);
      }
    }

    // Details rows -> current stage
    const detailsByCompany = new Map<number, (typeof tracker.details)[number]>();
    for (const row of tracker.details) {
      const id = resolver.resolve(row.company, `${TRACKER} Details`, row.line);
      if (id === null) continue;
      if (detailsByCompany.has(id))
        issues.push({ kind: "conflict", source: `${TRACKER} Details`, line: row.line, message: `second Details row for "${row.company}"` });
      detailsByCompany.set(id, row);
      db.prepare("INSERT OR IGNORE INTO company_alias (company_id, alias, origin) VALUES (?, ?, 'details')").run(id, row.company);
    }

    // Contacts CSV index
    type CsvRow = { [column: string]: string } & { _line: number; _used?: boolean };
    const csvRows = contactsCsv.map((r, i) => Object.assign({}, r, { _line: i + 2 }) as unknown as CsvRow);
    const csvByKey = new Map<string, CsvRow[]>();
    for (const r of csvRows) {
      const id = resolver.resolve(r.Company, CSV_NAME, r._line);
      if (id === null) continue;
      db.prepare("INSERT OR IGNORE INTO company_alias (company_id, alias, origin) VALUES (?, ?, 'contacts_csv')").run(id, r.Company);
      const key = `${id}|${normalizeName(r.Name)}`;
      csvByKey.set(key, [...(csvByKey.get(key) ?? []), r]);
    }

    const insertPerson = (name: string, email: string | null): number => {
      if (email) {
        const existing = one<{ id: number }>(db, "SELECT id FROM person WHERE email = ?", email);
        if (existing) return existing.id;
      }
      return Number(db.prepare("INSERT INTO person (name, email) VALUES (?, ?)").run(name, email).lastInsertRowid);
    };

    const sectionPersons = new Map<number, Map<string, number>>();
    const personFor = (companyId: number, name: string) => sectionPersons.get(companyId)?.get(normalizeName(name));
    const personByFirstName = (companyId: number, first: string) => {
      const map = sectionPersons.get(companyId);
      if (!map) return undefined;
      const k = normalizeName(first);
      const hits = [...map.entries()].filter(([n]) => n.startsWith(k));
      return hits.length === 1 ? hits[0][1] : undefined;
    };

    for (const s of tracker.sections) {
      const companyId = sectionCompany.get(s)!;
      const persons = new Map<string, number>();
      sectionPersons.set(companyId, persons);
      const company = one<{ name: string; source: string }>(db, "SELECT name, source FROM company WHERE id = ?", companyId)!;

      const ensureContact = (pname: string, role: "submitter" | "demo_contact", note: string | null, line: number) => {
        const key = normalizeName(pname);
        if (persons.has(key)) return persons.get(key)!;
        const csv = csvByKey.get(`${companyId}|${key}`);
        if (csv && csv.length > 1)
          issues.push({ kind: "conflict", source: CSV_NAME, line: csv[1]._line, message: `${pname} at ${company.name} has ${csv.length} rows; using the first` });
        const row = csv?.[0];
        if (row) {
          row._used = true;
          contactsMatched++;
        } else
          issues.push({ kind: "unmatched", source: TRACKER, line, message: `${pname} (${company.name}) has no contacts-CSV row, so no email or per-person dates` });
        const personId = insertPerson(pname, row?.Email?.trim() || null);
        persons.set(key, personId);
        const parsed = row ? parseStageLabel(row.Status) : null;
        if (row && !parsed) issues.push({ kind: "unparsed", source: CSV_NAME, line: row._line, message: `status "${row.Status}"` });
        db.prepare("INSERT INTO contact (person_id, company_id, role, status, status_note, note) VALUES (?, ?, ?, ?, ?, ?)").run(
          personId,
          companyId,
          role,
          parsed?.stage ?? "interested",
          parsed?.rest || null,
          note,
        );
        return personId;
      };

      // Submissions, oldest first
      const groups = [...s.groups].sort((a, b) => (isoDate(a.dateRaw) ?? "9").localeCompare(isoDate(b.dateRaw) ?? "9"));
      const seen = new Set<string>();
      let primary: number | null = null;
      for (const g of groups) {
        const pname = personName(g.name);
        const key = pname ? normalizeName(pname) : `__${g.line}`;
        const personId = pname ? ensureContact(pname, "submitter", g.contactNote ?? (company.source === "form" ? nameNote(g.name) : null), g.line) : null;
        const disposition = seen.size === 0 ? "counted" : seen.has(key) ? "repeat" : "stacked";
        seen.add(key);
        if (primary === null && personId) primary = personId;
        const when = g.dateRaw.match(/\d{4}-\d{2}-\d{2}(?: \d{2}:\d{2})?/)?.[0] ?? null;
        if (!when && company.source === "form")
          issues.push({ kind: "unparsed", source: TRACKER, line: g.line, message: `submission date "${g.dateRaw}" for ${pname}` });
        db.prepare(
          `INSERT INTO submission (person_id, person_name, company_id, submitted_at, source, form_company_field, title, relationship, disposition, reason, run_id)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        ).run(
          personId,
          pname ?? g.name ?? "—",
          companyId,
          when,
          company.source === "form" ? "labs_form" : company.source,
          g.submittedAs ?? (rename[s.heading] ? null : s.heading),
          g.title ?? null,
          g.relationship ?? null,
          disposition,
          disposition === "repeat" ? "same person listed twice in the tracker section" : rename[s.heading] ? "form company field blank; resolved from the email domain" : null,
          ctx.runId,
        );
      }
      if (primary) db.prepare("UPDATE company SET primary_person_id = ? WHERE id = ?").run(primary, companyId);

      for (const label of ["Demo contact", "Also on the demo"]) {
        const f = field(s, label);
        if (!f) continue;
        const m = f.value.match(/^([^(]+?)\s*(?:\((.*)\))?$/);
        if (m) ensureContact(m[1].trim(), "demo_contact", `${label}${m[2] ? `: ${m[2]}` : ""}`, f.line);
      }

      // Person-level do-not-email (Ariba)
      const dne = field(s, "Do not email");
      if (dne && !isoDate(dne.value.slice(0, 10))) {
        const who = dne.value.split(",")[0].trim();
        const pid = personFor(companyId, who);
        if (pid) {
          db.prepare("UPDATE person SET do_not_email_on = ?, do_not_email_reason = ? WHERE id = ?").run(isoDate(dne.value), dne.value, pid);
          db.prepare("UPDATE contact SET outreach_excluded_reason = ? WHERE person_id = ? AND company_id = ?").run(dne.value, pid, companyId);
        } else issues.push({ kind: "unmatched", source: TRACKER, line: dne.line, message: `Do not email names "${who}", not a submitter here` });
      }
    }

    // CSV rows the sections never mention
    for (const r of csvRows) {
      if (r._used) continue;
      const id = resolver.resolve(r.Company, CSV_NAME, r._line);
      issues.push({
        kind: "unmatched",
        source: CSV_NAME,
        line: r._line,
        message: `row "${r.Name}" (${r.Company}, ${r.Status}) matches no person in ${id ? "that company's section" : "any section"}; not imported`,
      });
    }

    // Do-not-email from CSV status (Sky Plc's is company-wide; its date comes from the section)
    for (const r of csvRows.filter((x) => x._used && /^do not email/i.test(x.Status))) {
      const p = one<{ id: number; do_not_email_reason: string | null }>(db, "SELECT id, do_not_email_reason FROM person WHERE email = ?", r.Email);
      if (!p || p.do_not_email_reason) continue;
      const s = tracker.sections.find((x) => sectionCompany.get(x) === resolver.resolve(r.Company, CSV_NAME, r._line));
      const f = s ? field(s, "Do not email") : undefined;
      db.prepare("UPDATE person SET do_not_email_on = ?, do_not_email_reason = ? WHERE id = ?").run(
        f ? isoDate(f.value) : null,
        f?.value ?? "Do not email (contacts CSV status)",
        p.id,
      );
    }

    // Stage history, touchpoints and research per company
    for (const s of tracker.sections) {
      const companyId = sectionCompany.get(s)!;
      const company = one<{ name: string }>(db, "SELECT name FROM company WHERE id = ?", companyId)!;
      const details = detailsByCompany.get(companyId);

      let target: Stage | null = null;
      let targetNote: string | null = null;
      let targetDate: string | null = null;
      if (details) {
        const parsed = parseStageLabel(details.status);
        if (!parsed) issues.push({ kind: "unparsed", source: `${TRACKER} Details`, line: details.line, message: `status "${details.status}"` });
        else {
          target = parsed.stage;
          targetNote = parsed.rest || null;
          if (/^\d{4}-\d{2}-\d{2}/.test(parsed.rest)) {
            targetDate = parsed.rest.slice(0, 10);
            targetNote = parsed.rest.slice(10).replace(/^[,\s]+/, "") || null;
          }
        }
      }
      const dneField = field(s, "Do not email");
      const notAFit = s.paragraphs.find((p) => p.base === "not a fit");
      if (!details) {
        if (dneField && isoDate(dneField.value.slice(0, 10))) {
          target = "do_not_email";
          targetDate = isoDate(dneField.value);
          targetNote = dneField.value.replace(/^\d{4}-\d{2}-\d{2}\.?\s*/, "");
        } else issues.push({ kind: "unmatched", source: TRACKER, line: s.line, message: `section "${s.heading}" has no Details row and no exit line; stage set to Interested` });
      }
      if (target === "not_a_fit" && notAFit) {
        targetDate = isoDate(notAFit.qualifier) ?? targetDate;
        targetNote = notAFit.body;
      }
      target ??= "interested";

      const firstDate = s.groups.map((g) => isoDate(g.dateRaw)).filter(Boolean).sort()[0] ?? null;
      const dated = new Map<Stage, { date: string | null; note?: string; line?: number }>();
      dated.set("interested", { date: firstDate });
      const em = dateField(s, "Email sent");
      if (em.date) dated.set("email_sent", { date: em.date, line: em.line });
      const fu = dateField(s, "Follow-up sent");
      if (fu.date) dated.set("follow_up_sent", { date: fu.date, line: fu.line });
      const rp = dateField(s, "Replied");
      if (rp.date) dated.set("replied", { date: rp.date, line: rp.line });
      const bs = dateField(s, "Beta scheduled");
      if (bs.date) dated.set("demo_scheduled", { date: bs.date, line: bs.line });
      const bi = dateField(s, "Beta invite sent");
      if (bi.date) dated.set("invited_to_beta", { date: bi.date, line: bi.line });
      const au = dateField(s, "Actively using");
      if (au.date) dated.set("actively_using", { date: au.date, note: au.rest || undefined, line: au.line });
      if (targetDate && !isExit(target) && !dated.get(target)?.date) dated.set(target, { date: targetDate });

      const top = isExit(target) ? Math.max(...[...dated.keys()].map(stageIndex)) : stageIndex(target);
      for (const st of FUNNEL_STAGES) {
        const idx = stageIndex(st.id);
        const d = dated.get(st.id);
        if (idx > top) {
          if (d?.date)
            issues.push({
              kind: "conflict",
              source: TRACKER,
              line: d.line,
              message: `${company.name}: section has a ${st.label} date (${d.date}) but the Details status is ${details?.status ?? target}; kept as a touchpoint, not a stage`,
            });
          continue;
        }
        if (!d && st.id !== target && st.id !== "interested") continue;
        const note = st.id === target ? [targetNote, d?.note].filter(Boolean).join("; ") || null : d?.note ?? null;
        db.prepare("INSERT INTO stage_event (company_id, stage, occurred_on, note, actor, run_id) VALUES (?, ?, ?, ?, 'import', ?)").run(
          companyId,
          st.id,
          d?.date ?? null,
          note,
          ctx.runId,
        );
      }
      if (isExit(target))
        db.prepare("INSERT INTO stage_event (company_id, stage, occurred_on, note, reason, actor, run_id) VALUES (?, ?, ?, ?, ?, 'import', ?)").run(
          companyId,
          target,
          targetDate,
          targetNote,
          targetNote,
          ctx.runId,
        );

      // Touchpoints: per person from the CSV, then section dates nobody in the CSV covers
      const tp = (personId: number | null, kind: string, date: string | null, source: string, note: string | null = null) =>
        db
          .prepare("INSERT INTO touchpoint (person_id, company_id, kind, occurred_on, source, note, actor, run_id) VALUES (?, ?, ?, ?, ?, ?, 'import', ?)")
          .run(personId, companyId, kind, date, source, note, ctx.runId);
      const covered = new Set<string>();
      for (const [pkey, personId] of sectionPersons.get(companyId)!) {
        const row = csvByKey.get(`${companyId}|${pkey}`)?.[0];
        if (!row) continue;
        const add = (kind: string, raw: string) => {
          const date = usDate(raw);
          if (raw && !date) issues.push({ kind: "unparsed", source: CSV_NAME, line: row._line, message: `date "${raw}"` });
          if (!date) return;
          tp(personId, kind, date, `import:${CSV_NAME}`);
          covered.add(`${kind}|${date}`);
          covered.add(`${kind}|${personId}`);
        };
        add("intro_email", row["Email Sent Date"]);
        add("follow_up", row["Follow-up Sent Date"]);
        add("demo_scheduled", row["Beta Scheduled Date"]);
        add("beta_invite", row["Beta Invite Sent Date"]);
        const st = parseStageLabel(row.Status);
        if (/^beta check-in sent/i.test(row.Status)) {
          const d = isoDate(row.Status);
          tp(personId, "beta_checkin", d, `import:${CSV_NAME}`);
          covered.add(`beta_checkin|${d}`);
        }
        if (st?.stage === "replied") {
          tp(personId, "reply_received", rp.date, `import:${CSV_NAME}`, rp.rest || null);
          covered.add(`reply_received|${rp.date}`);
        }
        if (st?.stage === "do_not_email") tp(personId, "opt_out", null, `import:${CSV_NAME}`);
      }
      const sectionTp = (label: string, kind: string) => {
        const f = dateField(s, label);
        if (!f.date) return;
        const named = kind === "follow_up" || kind === "beta_checkin" ? namesInParens(f.rest) : [];
        if (named.length) {
          for (const n of named) {
            const pid = personFor(companyId, n) ?? null;
            if (pid && covered.has(`${kind}|${pid}`)) continue;
            if (!pid) issues.push({ kind: "unmatched", source: TRACKER, line: f.line, message: `${label} names "${n}", not a contact at ${company.name}` });
            tp(pid, kind, f.date, `import:${TRACKER}`);
          }
        } else if (!covered.has(`${kind}|${f.date}`)) tp(null, kind, f.date, `import:${TRACKER}`, f.rest || null);
      };
      sectionTp("Email sent", "intro_email");
      sectionTp("Follow-up sent", "follow_up");
      sectionTp("Replied", "reply_received");
      sectionTp("Our reply", "our_reply");
      sectionTp("Beta scheduled", "demo_scheduled");
      sectionTp("Beta invite sent", "beta_invite");
      sectionTp("Beta check-in sent", "beta_checkin");

      // Research
      let sort = 0;
      const addField = (fieldName: string, labelRaw: string, qualifier: string | null, body: string, line: number) => {
        const info = db
          .prepare("INSERT INTO research_field (company_id, field, label_raw, qualifier, body_md, sort, as_of, actor, run_id) VALUES (?, ?, ?, ?, ?, ?, ?, 'import', ?)")
          .run(companyId, fieldName, labelRaw, qualifier, body, sort++, "2026-11-11", ctx.runId);
        for (const link of extractLinks(body)) {
          if (/^https?:/i.test(link.url))
            db.prepare("INSERT INTO research_source (research_field_id, url, link_text) VALUES (?, ?, ?)").run(info.lastInsertRowid, link.url, link.text);
          else
            db.prepare("INSERT OR IGNORE INTO company_link (company_id, kind, label, path_or_url) VALUES (?, ?, ?, ?)").run(
              companyId,
              /feedback-sessions/.test(link.url) ? "feedback_session" : "repo_doc",
              link.text,
              decodeURIComponent(link.url),
            );
        }
        if (!PARAGRAPH_FIELD[labelRaw.toLowerCase()] && fieldName === "other")
          issues.push({ kind: "note", source: TRACKER, line, message: `${company.name}: kept "${labelRaw}" as a generic research field` });
      };
      for (const p of s.paragraphs) addField(PARAGRAPH_FIELD[p.base] ?? "other", p.labelRaw, p.qualifier, p.body, p.line);
      for (const u of s.unlabelled) {
        addField("note", "note", null, u.text, u.line);
        issues.push({ kind: "note", source: TRACKER, line: u.line, message: `${company.name}: unlabelled paragraph kept as a note` });
      }
      for (const label of ["Follow-up", "Do not email", "Demo contact", "Also on the demo"]) {
        const f = field(s, label);
        if (f) addField(label === "Follow-up" ? "follow_up_note" : label === "Do not email" ? "do_not_email_note" : "demo_attendee", label, null, f.value, f.line);
      }
      for (const g of s.groups) if (g.contactNote) addField("contact_note", "Contact", null, g.contactNote, g.line);
      const rpField = field(s, "Replied");
      if (rpField && rp.rest) addField("reply_note", "Replied", null, rpField.value, rpField.line);

      // Salesforce
      const ownerField = field(s, "Account owner (Salesforce)");
      if (!ownerField) issues.push({ kind: "unparsed", source: TRACKER, line: s.line, message: `${company.name}: no Account owner line` });
      else {
        const parsed = parseOwnerLine(ownerField.value);
        for (const u of parsed.unparsed) issues.push({ kind: "unparsed", source: TRACKER, line: ownerField.line, message: `${company.name} owner clause "${u}"` });
        db.prepare("UPDATE company SET sf_lookup_status = ?, sf_owner_raw = ? WHERE id = ?").run(parsed.status, ownerField.value, companyId);
        const labels = new Map<string, string>();
        for (const part of splitTopLevel(details?.owner ?? "", ", ")) {
          const m = part.match(/^(.*?)\s*\((.*)\)$/);
          if (m) labels.set(m[1], m[2]);
        }
        for (const acc of parsed.accounts) linkAccount(db, issues, company.name, companyId, acc, labels.get(acc.owner) ?? null, (n) => personFor(companyId, n) ?? personByFirstName(companyId, n), ownerField.line);
      }
    }

    for (const extra of aliasesJson.extra_sf_accounts) {
      const companyId = one<{ id: number }>(db, "SELECT id FROM company WHERE name = ?", extra.company)?.id;
      if (!companyId) continue;
      linkAccount(
        db,
        issues,
        extra.company,
        companyId,
        { owner: extra.owner, account: extra.account, type: extra.type, persons: [extra.person], matchMethod: "contact_email", note: extra.note },
        extra.label,
        (n) => personFor(companyId, n),
        undefined,
      );
    }

    importExclusions(db, issues, tracker, resolver, personFor, ctx.runId!);
    importAgentStacks(db, issues, tracker, resolver);
    importCohorts(db, issues, cohortsDoc, resolver, personFor);
    importFit(db, issues, fitDoc, resolver, personFor);
    importOtherCsvs(db, issues, resolver);

    const notes: Record<string, string> = {
      "tracker.intro": tracker.intro,
      "tracker.agent_stacks_intro": tracker.agentStacksIntro,
      "tracker.pipeline_intro": tracker.pipelineIntro,
      "tracker.status_legend": tracker.statusLegend,
      "cohorts.intro": cohortsDoc.intro,
      "cohorts.how_to_update": cohortsDoc.howToUpdate,
      ...fitDoc.notes,
    };
    for (const [k, v] of Object.entries(notes)) if (v) db.prepare("INSERT INTO app_note (key, body_md) VALUES (?, ?)").run(k, v);

    for (const [key, file] of [
      ["last_processed", SOURCES.lastProcessed],
      ["last_reply_check", SOURCES.lastReplyCheck],
    ] as const) {
      if (fs.existsSync(file)) db.prepare("INSERT INTO sync_state (key, value) VALUES (?, ?)").run(key, fs.readFileSync(file, "utf8").trim());
      else issues.push({ kind: "note", source: file, message: "marker file missing" });
    }

    for (const c of all<{ id: number; name: string }>(db, "SELECT id, name FROM company"))
      logChange(ctx, { entity: "company", entityId: c.id, companyId: c.id, action: "import", after: { name: c.name } });
    db.prepare("UPDATE sync_run SET status = 'ok', finished_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE id = ?").run(ctx.runId);
  })();

  return { dbPath, issues, tracker, cohorts: cohortsDoc, fit: fitDoc, contactsCsv, contactsMatched };
}

function linkAccount(
  db: DB,
  issues: Issue[],
  companyName: string,
  companyId: number,
  acc: { owner: string; account: string; type: string | null; persons: string[]; matchMethod: string; note: string | null },
  label: string | null,
  findPerson: (name: string) => number | undefined,
  line: number | undefined,
) {
  const placeholder = ["Tricentis Bulldog"].includes(acc.owner) ? 1 : 0;
  let account = one<{ id: number; owner_name: string; type: string | null }>(db, "SELECT id, owner_name, type FROM sf_account WHERE name = ?", acc.account);
  if (!account) {
    const id = Number(
      db
        .prepare("INSERT INTO sf_account (name, type, owner_name, owner_is_placeholder, looked_up_on) VALUES (?, ?, ?, ?, '2026-11-11')")
        .run(acc.account, acc.type, acc.owner, placeholder).lastInsertRowid,
    );
    account = { id, owner_name: acc.owner, type: acc.type };
  } else if (account.owner_name !== acc.owner)
    issues.push({ kind: "conflict", source: TRACKER, line, message: `account "${acc.account}" has owner ${account.owner_name} in one section and ${acc.owner} in ${companyName}` });
  const persons = acc.persons.length ? acc.persons : [null];
  for (const p of persons) {
    const pid = p ? findPerson(p) ?? null : null;
    if (p && !pid) issues.push({ kind: "unmatched", source: TRACKER, line, message: `${companyName}: owner line names "${p}", not a contact there` });
    db.prepare(
      "INSERT OR IGNORE INTO company_sf_account (company_id, sf_account_id, person_id, match_method, label, note) VALUES (?, ?, ?, ?, ?, ?)",
    ).run(companyId, account.id, pid, acc.matchMethod, label, acc.note);
  }
}

function importExclusions(
  db: DB,
  issues: Issue[],
  tracker: Tracker,
  resolver: Resolver,
  personFor: (companyId: number, name: string) => number | undefined,
  runId: number,
) {
  for (const e of exclusionsJson.excluded) {
    if (!tracker.intro.includes(e.name)) issues.push({ kind: "conflict", source: "exclusions.json", message: `"${e.name}" is not in the tracker intro` });
    db.prepare(
      "INSERT INTO submission (person_name, submitted_at, source, form_company_field, disposition, disposition_rule, reason, run_id) VALUES (?, ?, 'labs_form', ?, 'excluded', ?, ?, ?)",
    ).run(e.name, e.date, e.form_company, e.rule, e.reason, runId);
  }
  for (const r of exclusionsJson.repeats) {
    if (!tracker.intro.includes(r.name)) issues.push({ kind: "conflict", source: "exclusions.json", message: `"${r.name}" is not in the tracker intro` });
    const companyId = resolver.resolve(r.company, "exclusions.json");
    const pid = companyId ? personFor(companyId, r.name) ?? null : null;
    if (!pid) issues.push({ kind: "unmatched", source: "exclusions.json", message: `repeat "${r.name}" matches no contact at ${r.company}` });
    db.prepare(
      "INSERT INTO submission (person_id, person_name, company_id, submitted_at, source, form_company_field, disposition, disposition_rule, reason, run_id) VALUES (?, ?, ?, ?, 'labs_form', ?, 'repeat', 'repeat', ?, ?)",
    ).run(pid, r.name, companyId, r.date, r.form_company, r.reason, runId);
  }
}

function importAgentStacks(db: DB, issues: Issue[], tracker: Tracker, resolver: Resolver) {
  for (const row of tracker.agentStacks) {
    const stackId = one<{ id: number }>(db, "SELECT id FROM agent_stack WHERE name = ?", row.stack)!.id;
    const parts = splitTopLevel(row.accounts, ", ");
    if (parts.length !== row.count)
      issues.push({ kind: "conflict", source: `${TRACKER} Agent Stacks`, line: row.line, message: `"${row.stack}" says ${row.count} companies but lists ${parts.length}` });
    for (const part of parts) {
      const m = part.match(/^(.*?)\s*(?:\(([^)]*)\))?$/)!;
      const id = resolver.resolve(part, `${TRACKER} Agent Stacks`, row.line) ?? (m[2] ? resolver.resolve(m[1], `${TRACKER} Agent Stacks`, row.line) : null);
      if (!id) continue;
      db.prepare("INSERT OR IGNORE INTO company_agent_stack (company_id, stack_id, qualifier) VALUES (?, ?, ?)").run(id, stackId, m[2] ?? null);
    }
  }
}

function importCohorts(
  db: DB,
  issues: Issue[],
  doc: CohortsDoc,
  resolver: Resolver,
  personFor: (companyId: number, name: string) => number | undefined,
) {
  for (const c of doc.cohorts) {
    const cohortId = Number(
      db.prepare("INSERT INTO cohort (number, invite_sent_on, how_chosen, notes_md) VALUES (?, ?, ?, ?)").run(c.number, c.invitedOn, c.howChosen, c.notes).lastInsertRowid,
    );
    for (const row of c.rows) {
      const companyId = resolver.resolve(row.company, "Beta Cohorts.md", row.line);
      if (!companyId) continue;
      for (const u of row.users) {
        const pid = personFor(companyId, u) ?? null;
        if (!pid) issues.push({ kind: "unmatched", source: "Beta Cohorts.md", line: row.line, message: `invited user "${u}" is not a contact at ${row.company}` });
        db.prepare("INSERT INTO cohort_member (cohort_id, company_id, person_id, invite_sent_on, demo_scheduled_on) VALUES (?, ?, ?, ?, ?)").run(
          cohortId,
          companyId,
          pid,
          row.inviteSent,
          row.earliestScheduled,
        );
      }
      if (row.firstSignin) {
        const active = one<{ body_md: string }>(db, "SELECT body_md FROM research_field WHERE company_id = ? AND label_raw = 'Actively using'", companyId);
        db.prepare("INSERT INTO first_signin (company_id, signed_in_on, kind, note, actor) VALUES (?, ?, ?, ?, 'import')").run(
          companyId,
          row.firstSignin,
          "reported_use",
          active?.body_md ?? "Date use was reported, not a product login timestamp (Beta Cohorts notes).",
        );
      }
    }
  }
}

function importFit(
  db: DB,
  issues: Issue[],
  doc: FitDoc,
  resolver: Resolver,
  personFor: (companyId: number, name: string) => number | undefined,
) {
  const p = doc.payload;
  for (const a of p.accounts) {
    const id = resolver.resolve(a.company, "AgentScore-interest-fit.html accounts");
    if (!id) continue;
    db.prepare("INSERT OR IGNORE INTO company_alias (company_id, alias, origin) VALUES (?, ?, 'fit')").run(id, a.company);
    db.prepare(
      "INSERT INTO fit_assessment (company_id, bucket_id, evidence, why, fit_label, assessed_on, actor) VALUES (?, ?, ?, ?, ?, '2026-11-02', 'import')",
    ).run(id, a.bucket, a.evidence, a.why, JSON.stringify({ name: a.company, stage: a.stage, people: a.people, owner: a.owner ?? null }));
  }
  p.chase.forEach((name, i) => {
    const id = resolver.resolve(name, "AgentScore-interest-fit.html chase");
    if (id) db.prepare("UPDATE company SET chase_rank = ? WHERE id = ?").run(i + 1, id);
  });
  const aliases = all<{ company_id: number; alias: string }>(db, "SELECT company_id, alias FROM company_alias WHERE origin = 'fit'");
  p.leaks.forEach(([title, count, action], i) => {
    const insightId = Number(
      db.prepare("INSERT INTO funnel_insight (title, count_text, action_md, sort) VALUES (?, ?, ?, ?)").run(title, count, action, i).lastInsertRowid,
    );
    const text = `${title} ${action}`;
    for (const a of aliases) {
      const re = new RegExp(`(^|[^A-Za-z])${a.alias.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?![A-Za-z])`);
      if (a.alias.length >= 2 && re.test(text))
        db.prepare("INSERT OR IGNORE INTO funnel_insight_company (insight_id, company_id) VALUES (?, ?)").run(insightId, a.company_id);
    }
  });
  const kindMap: Record<string, string> = { "no-company": "no_company", internal: "internal", duplicate: "duplicate" };
  p.quality.forEach((q, i) => {
    let companyId: number | null = null;
    let submissionId: number | null = null;
    const sub = one<{ id: number; company_id: number | null }>(db, "SELECT id, company_id FROM submission WHERE person_name = ? ORDER BY id LIMIT 1", q.who);
    if (sub) {
      submissionId = sub.id;
      companyId = sub.company_id;
    }
    db.prepare("INSERT INTO signup_issue (kind, who, when_text, detail, submission_id, company_id, sort) VALUES (?, ?, ?, ?, ?, ?, ?)").run(
      kindMap[q.kind] ?? q.kind,
      q.who,
      q.when,
      q.detail,
      submissionId,
      companyId,
      i,
    );
  });
  void personFor;
}

function importOtherCsvs(db: DB, issues: Issue[], resolver: Resolver) {
  const one_ = csvObjects(fs.readFileSync(SOURCES.oneEmailFollowupCsv, "utf8"));
  one_.forEach((r, i) => {
    const companyId = resolver.resolve(r.Company, "external-interest-one-email-followup.csv", i + 2);
    const p = one<{ id: number }>(db, "SELECT id FROM person WHERE email = ?", r.Email);
    if (!companyId || !p) {
      issues.push({ kind: "unmatched", source: "external-interest-one-email-followup.csv", line: i + 2, message: `"${r.Name}" (${r.Company}) matches no contact` });
      return;
    }
    const date = isoDate(r["Email Sent Date"]);
    const has = one(db, "SELECT 1 FROM touchpoint WHERE person_id = ? AND kind = 'intro_email'", p.id);
    if (!has && date) {
      db.prepare(
        "INSERT INTO touchpoint (person_id, company_id, kind, occurred_on, source, actor) VALUES (?, ?, 'intro_email', ?, 'import:external-interest-one-email-followup.csv', 'import')",
      ).run(p.id, companyId, date);
      issues.push({ kind: "note", source: "external-interest-one-email-followup.csv", line: i + 2, message: `added intro email ${date} for ${r.Name} (${r.Company}); the contacts CSV had no Email Sent Date` });
    }
  });
  const nr = csvObjects(fs.readFileSync(SOURCES.noResponseFollowupCsv, "utf8"));
  nr.forEach((r, i) => {
    const p = one<{ id: number }>(db, "SELECT id FROM person WHERE email = ?", r.Email);
    if (!p) issues.push({ kind: "unmatched", source: "external-interest-no-response-followup.csv", line: i + 2, message: `"${r.Name}" (${r.Company}) matches no contact` });
  });
}

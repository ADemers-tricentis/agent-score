import fs from "node:fs";
import path from "node:path";
import { APP_ROOT, SNAPSHOT_PATH } from "./config.ts";
import { all, one, type DB } from "./db.ts";
import { funnelCounts } from "./queries.ts";
import { cohorts, leads, ownerText, type Lead } from "./read.ts";
import { stageLabel } from "./stages.ts";

const HEADER_FIELDS = new Set(["follow_up_note", "do_not_email_note", "demo_attendee", "contact_note", "reply_note"]);

const note = (db: DB, key: string) => one<{ body_md: string }>(db, "SELECT body_md FROM app_note WHERE key = ?", key)?.body_md ?? "";

/** Notes the service layer writes on automatic moves; they explain the timeline, not the status. */
const AUTO_NOTE = /^(from [a-z_]+|first sign-in|merged from .+)$/;

export function statusText(l: Pick<Lead, "stage" | "stage_on" | "stage_note">): string {
  const label = stageLabel(l.stage);
  const bits = [l.stage_on, l.stage_note && !AUTO_NOTE.test(l.stage_note) ? l.stage_note : null].filter(Boolean).join(", ");
  return bits ? `${label} — ${bits}` : label;
}

function cell(s: string | null | undefined) {
  return (s ?? "").replace(/\|/g, "\\|").replace(/\n/g, " ");
}

function composeOwnerLine(db: DB, companyId: number, status: string): string {
  if (status === "no_account") return "No account";
  if (status === "not_looked_up") return "Not looked up";
  const rows = all<{ owner_name: string; account: string; type: string | null; person: string | null; note: string | null }>(
    db,
    `SELECT a.owner_name, a.name AS account, a.type, p.name AS person, csa.note
     FROM company_sf_account csa JOIN sf_account a ON a.id = csa.sf_account_id LEFT JOIN person p ON p.id = csa.person_id
     WHERE csa.company_id = ? ORDER BY csa.id`,
    companyId,
  );
  const byAccount = new Map<string, { owner: string; type: string | null; persons: string[]; note: string | null }>();
  for (const r of rows) {
    const e = byAccount.get(r.account) ?? { owner: r.owner_name, type: r.type, persons: [], note: r.note };
    if (r.person) e.persons.push(r.person);
    byAccount.set(r.account, e);
  }
  const many = byAccount.size > 1;
  return [...byAccount.entries()]
    .map(([account, e]) => {
      const inner = [account, e.type, e.note].filter(Boolean).join(", ");
      const forWho = many && e.persons.length ? ` for ${e.persons.join(", ")}` : "";
      return `${e.owner} (account: ${inner})${forWho}`;
    })
    .join("; ");
}

function companySection(db: DB, l: Lead): string {
  const c = one<{ source: string; source_detail: string | null; sf_owner_raw: string | null; sf_lookup_status: string }>(
    db,
    "SELECT source, source_detail, sf_owner_raw, sf_lookup_status FROM company WHERE id = ?",
    l.id,
  )!;
  const out: string[] = [`### ${l.name}`, ""];
  const research = all<{ field: string; label_raw: string; body_md: string }>(
    db,
    "SELECT field, label_raw, body_md FROM research_field WHERE company_id = ? ORDER BY sort, id",
    l.id,
  );
  const headerField = (f: string) => research.filter((r) => r.field === f);

  const subs = all<{ submitted_at: string | null; person_name: string; title: string | null; relationship: string | null; form_company_field: string | null; source: string; person_id: number | null }>(
    db,
    `SELECT submitted_at, person_name, title, relationship, form_company_field, source, person_id FROM submission
     WHERE company_id = ? AND disposition IN ('counted', 'stacked') ORDER BY coalesce(submitted_at, '') DESC, id`,
    l.id,
  );
  for (const s of subs) {
    if (s.source === "sales") out.push(`Date: ${s.submitted_at ?? "-"} (Sales conversation - no Labs form submission)  `);
    else if (s.source === "referral") out.push(`Date: (${c.source_detail ?? "referral"} - not a Labs form submission)  `);
    else out.push(`Date: ${s.submitted_at ?? "not recorded"}  `);
    out.push(`Name: ${s.person_name}${s.source === "sales" && c.source_detail ? ` (${c.source_detail})` : ""}  `);
    if (s.title) out.push(`Title: ${s.title}  `);
    if (s.relationship) out.push(`Relationship: ${s.relationship}  `);
    if (s.form_company_field && s.form_company_field !== l.name) out.push(`Submitted as: ${s.form_company_field}  `);
    const contactNote = s.person_id
      ? one<{ note: string | null }>(db, "SELECT note FROM contact WHERE company_id = ? AND person_id = ? AND role = 'submitter'", l.id, s.person_id)?.note
      : null;
    if (contactNote && /domain|address/i.test(contactNote)) out.push(`Contact: ${contactNote}  `);
    out.push("");
  }
  for (const d of headerField("demo_attendee")) out.push(`${d.label_raw}: ${d.body_md}  `);
  if (headerField("demo_attendee").length) out.push("");

  const tp = (kind: string, agg: "min" | "max") =>
    one<{ d: string | null }>(db, `SELECT ${agg}(occurred_on) AS d FROM touchpoint WHERE company_id = ? AND kind = ?`, l.id, kind)?.d ?? null;
  const owner = c.sf_owner_raw ?? composeOwnerLine(db, l.id, c.sf_lookup_status);
  out.push(`Account owner (Salesforce): ${owner}  `);
  out.push(`Email sent: ${tp("intro_email", "min") ?? "—"}  `);
  const fu = tp("follow_up", "max");
  if (fu) out.push(`Follow-up sent: ${fu}  `);
  const replyNote = headerField("reply_note")[0];
  const replied = tp("reply_received", "min");
  if (replyNote) out.push(`Replied: ${replyNote.body_md.replace(/^Replied:\s*/, "")}  `);
  else if (replied) out.push(`Replied: ${replied}  `);
  const ours = tp("our_reply", "min");
  if (ours) out.push(`Our reply: ${ours}  `);
  out.push(`Beta scheduled: ${tp("demo_scheduled", "min") ?? "—"}  `);
  const invite = tp("beta_invite", "min");
  if (invite) out.push(`Beta invite sent: ${invite}  `);
  const checkin = tp("beta_checkin", "max");
  if (checkin) out.push(`Beta check-in sent: ${checkin}  `);
  const signin = one<{ signed_in_on: string; kind: string }>(db, "SELECT signed_in_on, kind FROM first_signin WHERE company_id = ? ORDER BY signed_in_on LIMIT 1", l.id);
  if (signin) out.push(`Actively using: ${signin.signed_in_on}${signin.kind === "reported_use" ? " (reported; no product sign-in timestamp)" : ""}  `);
  for (const f of headerField("follow_up_note")) out.push(`Follow-up: ${f.body_md}  `);
  const dne = headerField("do_not_email_note");
  for (const f of dne) out.push(`Do not email: ${f.body_md}  `);
  if (l.stage === "do_not_email" && !dne.length) out.push(`Do not email: ${[l.stage_on, l.stage_note].filter(Boolean).join(". ")}  `);
  out.push("");

  if (l.stage === "not_a_fit" && !research.some((r) => r.field === "exit_note"))
    out.push(`Not a fit (${l.stage_on ?? "date not recorded"}): ${l.stage_note ?? ""}`, "");
  for (const r of research) {
    if (HEADER_FIELDS.has(r.field)) continue;
    out.push(r.field === "note" ? r.body_md : `${r.label_raw}: ${r.body_md}`, "");
  }
  for (const n of all<{ body_md: string; created_at: string; actor: string }>(db, "SELECT body_md, created_at, actor FROM company_note WHERE company_id = ? ORDER BY id", l.id))
    out.push(`note (${n.created_at.slice(0, 10)}, ${n.actor}): ${n.body_md}`, "");
  out.push("---", "");
  return out.join("\n");
}

function cohortSection(db: DB): string {
  const cs = cohorts(db);
  const out = [
    "## Beta Cohorts",
    "",
    note(db, "cohorts.intro")
      .split("\n")
      .filter((l) => !/^Last updated:/.test(l))
      .join("\n"),
    "",
    "| Cohort | Invite sent | Users invited | Companies | Companies signed in | Median days signup to invite (per company) | Median days invite to first sign-in |",
    "|---|---|---|---|---|---|---|",
  ];
  for (const c of cs) {
    const range = c.rangeSignupToInvite && c.rows.filter((r) => r.daysSignupToInvite !== null).length > 1 ? ` (range ${c.rangeSignupToInvite[0]}-${c.rangeSignupToInvite[1]})` : "";
    const signins = c.rows.filter((r) => r.daysInviteToSignin !== null).length;
    out.push(
      `| ${c.number} | ${c.invite_sent_on ?? "not recorded"} | ${c.users} | ${c.rows.length} | ${c.signedIn} of ${c.rows.length} | ${c.medianSignupToInvite ?? "n/a"}${range} | ${
        c.medianInviteToSignin === null ? "n/a (no sign-ins yet)" : `${c.medianInviteToSignin} (${signins} compan${signins === 1 ? "y" : "ies"})`
      } |`,
    );
  }
  for (const c of cs) {
    out.push("", `### Cohort ${c.number} - invited ${c.invite_sent_on ?? "date not recorded"}`, "");
    if (c.how_chosen) out.push(`**How they were chosen:** ${c.how_chosen}`, "");
    out.push(
      "| Company | Users invited | Earliest form signup | Earliest demo/beta scheduled | Invite sent | Days signup to invite | First sign-in | Days invite to sign-in |",
      "|---|---|---|---|---|---|---|---|",
    );
    for (const r of c.rows)
      out.push(
        `| ${cell(r.company)} | ${cell(r.users.join(", "))} | ${r.signup ?? "not recorded"} | ${r.scheduled ?? "not recorded"} | ${r.invite ?? "not recorded"} | ${r.daysSignupToInvite ?? "n/a"} | ${r.firstSignin ?? "not yet"} | ${r.daysInviteToSignin ?? "-"} |`,
      );
    if (c.notes_md) out.push("", "Notes:", "", c.notes_md);
  }
  return out.join("\n");
}

/** Submissions recorded after the import, grouped the way the intro used to describe them by hand. */
function sinceImport(db: DB): string {
  const rows = all<{ person_name: string; submitted_at: string | null; disposition: string; disposition_rule: string | null; reason: string | null; company: string | null }>(
    db,
    `SELECT s.person_name, s.submitted_at, s.disposition, s.disposition_rule, s.reason, c.name AS company
     FROM submission s JOIN sync_run r ON r.id = s.run_id LEFT JOIN company c ON c.id = s.company_id
     WHERE r.kind <> 'import' ORDER BY s.submitted_at, s.id`,
  );
  const imported = one<{ d: string | null }>(db, "SELECT substr(started_at, 1, 10) AS d FROM sync_run WHERE kind = 'import' ORDER BY id DESC LIMIT 1")?.d;
  if (!rows.length) return `Since the import${imported ? ` on ${imported}` : ""}: no new submissions recorded.`;
  const d = (s: string | null) => (s ? s.slice(0, 10) : "date not recorded");
  const group = (disp: string, fmt: (r: (typeof rows)[number]) => string) => rows.filter((r) => r.disposition === disp).map(fmt);
  const parts = [
    ["New companies", group("counted", (r) => `${r.company} (${r.person_name}, ${d(r.submitted_at)})`)],
    ["Stacked on existing companies", group("stacked", (r) => `${r.person_name} (${d(r.submitted_at)}, ${r.company})`)],
    ["Repeats not counted", group("repeat", (r) => `${r.person_name} (${d(r.submitted_at)}, ${r.company ?? "unknown"}${r.reason ? `: ${r.reason}` : ""})`)],
    ["Excluded", group("excluded", (r) => `${r.person_name} (${d(r.submitted_at)}, ${(r.disposition_rule ?? "").replace(/_/g, " ")}${r.reason ? `: ${r.reason}` : ""})`)],
    ["Held for review", group("held", (r) => `${r.person_name} (${d(r.submitted_at)})`)],
  ].filter(([, xs]) => xs.length) as [string, string[]][];
  return `Since the import${imported ? ` on ${imported}` : ""}, sync runs recorded ${rows.length} submission${rows.length === 1 ? "" : "s"}. ${parts.map(([k, xs]) => `${k}: ${xs.join("; ")}.`).join(" ")}`;
}

export function renderSnapshot(db: DB, generatedAt = new Date()): string {
  const counts = funnelCounts(db);
  const all_ = leads(db);
  const inFunnel = all_.filter((l) => l.stage !== "not_a_fit" && l.stage !== "do_not_email");
  const exited = all_.filter((l) => l.stage === "not_a_fit" || l.stage === "do_not_email");
  const bySource = (s: string) => inFunnel.filter((l) => l.source === s);
  const notEmailed = inFunnel.filter((l) => l.stage === "interested");
  const active = inFunnel.filter((l) => l.stage === "actively_using");
  const invitedNoSignin = inFunnel.filter((l) => l.stage === "invited_to_beta");

  const stacks = all<{ name: string; companies: string | null; n: number }>(
    db,
    `SELECT s.name, count(cas.id) AS n,
            group_concat(c.name || CASE WHEN cas.qualifier IS NOT NULL THEN ' (' || cas.qualifier || ')' ELSE '' END, ', ') AS companies
     FROM agent_stack s LEFT JOIN company_agent_stack cas ON cas.stack_id = s.id LEFT JOIN company c ON c.id = cas.company_id
     GROUP BY s.id ORDER BY count(cas.id) DESC, s.sort`,
  );

  const lines = [
    `# External Interest — Tricentis Labs "AI Agent Testing and Evaluation" Submissions`,
    "",
    `> Generated by the interest-funnel app (\`${APP_ROOT}\`) at ${generatedAt.toISOString()}. Read-only: edits to this file are overwritten. Change data in the app (\`pnpm start\`) or with \`bin/funnel\`.`,
    "",
    note(db, "tracker.intro"),
    "",
    sinceImport(db),
    "",
    "---",
    "",
    "## Agent Stacks (stated on calls)",
    "",
    note(db, "tracker.agent_stacks_intro"),
    "",
    "| Agent stack | Companies | Accounts |",
    "|---|---|---|",
    ...stacks.map((s) => `| ${cell(s.name)} | ${s.n} | ${cell(s.companies)} |`),
    "",
    "---",
    "",
    "## Pipeline Tracker",
    "",
    `Source breakdown: ${bySource("form").length} via the Labs form, ${bySource("sales").length} via Sales (${bySource("sales").map((l) => l.name).join(", ")}), ${bySource("referral").length} via referral (${bySource("referral").map((l) => l.name).join(", ")}) = ${counts.total} total. Of those ${counts.total}, ${counts.stages[1].cumulative} were emailed${notEmailed.length ? `: ${notEmailed.map((l) => l.name).join(" and ")} ${notEmailed.length === 1 ? "was" : "were"} not` : ""}. Outside the funnel: ${exited.map((l) => `${l.name} (${statusText(l)})`).join("; ") || "none"}.`,
    "",
    "Both tables use the same stages. Cumulative counts every company at that stage or a later one, so each cumulative cell equals its current cell plus every current cell below it. Current counts companies whose latest stage is that stage. Not a fit and Do not email companies are in neither. The app computes both tables from each company's stage history; nobody edits them by hand.",
    "",
    `Invited to beta means the invite went out. Actively using means a first sign-in is recorded: ${active.map((l) => l.name).join(", ") || "none yet"}. Invited with no sign-in: ${invitedNoSignin.map((l) => l.name).join(", ") || "none"}.`,
    "",
    "### Cumulative",
    "",
    "| Stage | Companies |",
    "|---|---|",
    ...counts.stages.map((s) => `| ${s.label} | ${s.cumulative} |`),
    "",
    "### Current stage",
    "",
    "| Stage | Companies |",
    "|---|---|",
    ...counts.stages.map((s) => `| ${s.label} | ${s.current} |`),
    "",
    "## Details",
    "",
    "| Company | Contact | Account owner (Salesforce) | Status |",
    "| --- | --- | --- | --- |",
    ...all_.map((l) => `| ${cell(l.name)} | ${cell(l.contacts ?? `— (${l.source})`)} | ${cell(ownerText(l))} | ${cell(statusText(l))} |`),
    "",
    note(db, "tracker.status_legend"),
    "",
    cohortSection(db),
    "",
    "---",
    "",
    ...all_.map((l) => companySection(db, l)),
  ];
  return lines.join("\n").replace(/\n{3,}/g, "\n\n");
}

export function writeSnapshot(db: DB, file = SNAPSHOT_PATH): string {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, renderSnapshot(db));
  return file;
}

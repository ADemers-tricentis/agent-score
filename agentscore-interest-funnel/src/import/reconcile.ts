import { all, one, type DB } from "../db.ts";
import { daysBetween, funnelCounts, median, ownersByCompany } from "../queries.ts";
import { splitTopLevel } from "./text.ts";
import type { ImportResult } from "./importer.ts";

type Check = { what: string; expected: string | number; actual: string | number; ok: boolean; note?: string };

export function reconcile(db: DB, r: ImportResult): { markdown: string; failures: number } {
  const checks: Check[] = [];
  const check = (what: string, expected: string | number, actual: string | number, note?: string) =>
    checks.push({ what, expected, actual, ok: String(expected) === String(actual), note });
  const counts = funnelCounts(db);
  const intro = r.tracker.pipelineIntro;

  // Headline numbers
  const total = Number(intro.match(/=\s*(\d+) total/)?.[1]);
  const emailed = Number(intro.match(/(\d+) were emailed/)?.[1]);
  check("Companies in the funnel", total, counts.total);
  check("Companies emailed (cumulative Email sent)", emailed, counts.stages.find((s) => s.id === "email_sent")!.cumulative);
  check("Not a fit (outside the funnel)", 1, counts.exited.not_a_fit, "Ferrara Candy");
  check("Do not email (outside the funnel)", 1, counts.exited.do_not_email, "Sky Plc");
  const bySource = Object.fromEntries(
    all<{ source: string; n: number }>(
      db,
      `SELECT c.source, count(*) AS n FROM company c
       JOIN stage_event se ON se.id = (SELECT max(id) FROM stage_event WHERE company_id = c.id)
       WHERE se.stage NOT IN ('not_a_fit', 'do_not_email') GROUP BY c.source`,
    ).map((x) => [x.source, x.n]),
  );
  check("Companies via the Labs form", Number(intro.match(/(\d+) via the Labs form/)?.[1]), bySource.form ?? 0);
  check("Companies via Sales", Number(intro.match(/(\d+) via Sales/)?.[1]), bySource.sales ?? 0);
  check("Companies via referral (Eaton)", 1, bySource.referral ?? 0);

  for (const s of counts.stages) {
    check(`Cumulative: ${s.label}`, r.tracker.cumulative[s.label] ?? "missing", s.cumulative);
    check(`Current: ${s.label}`, r.tracker.current[s.label] ?? "missing", s.current);
  }

  // Structure
  check("Company sections imported", r.tracker.sections.length, one<{ n: number }>(db, "SELECT count(*) AS n FROM company")!.n);
  check("Details rows", 117, r.tracker.details.length, "116 counted + Ferrara; Sky Plc has a section but no row");
  const groups = r.tracker.sections.reduce((n, s) => n + s.groups.length, 0);
  check("Submitter groups in sections -> submissions", groups, one<{ n: number }>(db, "SELECT count(*) AS n FROM submission WHERE disposition IN ('counted','stacked') OR (disposition = 'repeat' AND disposition_rule IS NULL)")!.n);
  check(
    "Contacts CSV rows matched to a person (excluding PG&E's placeholder row)",
    r.contactsCsv.filter((x) => !/^—/.test(x.Name)).length,
    r.contactsMatched,
    "PG&E's row is '— (via Sales: Greg Campbell)': no contact was captured",
  );
  check("People with an email", r.contactsCsv.filter((x) => x.Email).length, one<{ n: number }>(db, "SELECT count(*) AS n FROM person WHERE email IS NOT NULL")!.n);

  // Intro paragraph submission arithmetic
  const n = (sql: string) => one<{ n: number }>(db, sql)!.n;
  check("Labs form notifications 2026-08-19 to 2026-11-10", Number(r.tracker.intro.match(/(\d+) notifications/)?.[1]), n("SELECT count(*) AS n FROM submission WHERE source = 'labs_form'"));
  check("Internal @tricentis.com submissions excluded", 12, n("SELECT count(*) AS n FROM submission WHERE disposition_rule = 'internal'"));
  check("Same-person repeats", 11, n("SELECT count(*) AS n FROM submission WHERE disposition = 'repeat'"));
  const ferrara = "(SELECT id FROM company WHERE name = 'Ferrara Candy Company')";
  const neotys = n("SELECT count(*) AS n FROM submission WHERE disposition_rule = 'owned_brand'");
  check(
    "External non-duplicate submissions (incl. Neotys, excl. Ferrara)",
    143,
    n(`SELECT count(*) AS n FROM submission WHERE source = 'labs_form' AND disposition IN ('counted','stacked') AND company_id <> ${ferrara}`) + neotys,
    "167 - 12 internal - 11 repeats - Ferrara",
  );
  check(
    "Companies after stacking (incl. Neotys and Sky Plc)",
    113,
    n(`SELECT count(*) AS n FROM submission WHERE source = 'labs_form' AND disposition = 'counted' AND company_id <> ${ferrara}`) + neotys,
  );

  // Cohorts
  for (const c of r.cohorts.cohorts) {
    const summary = r.cohorts.summary.find((s) => s["Cohort"] === String(c.number));
    const members = all<{ company_id: number; person_id: number | null; invite_sent_on: string }>(
      db,
      "SELECT cm.company_id, cm.person_id, cm.invite_sent_on FROM cohort_member cm JOIN cohort co ON co.id = cm.cohort_id WHERE co.number = ?",
      c.number,
    );
    const companies = [...new Set(members.map((m) => m.company_id))];
    const signedIn = companies.filter((id) => one(db, "SELECT 1 FROM first_signin WHERE company_id = ?", id));
    const signupToInvite: number[] = [];
    const inviteToSignin: number[] = [];
    for (const id of companies) {
      const pids = members.filter((m) => m.company_id === id && m.person_id).map((m) => m.person_id);
      const invite = members.find((m) => m.company_id === id)!.invite_sent_on;
      const signup = pids.length
        ? one<{ d: string | null }>(
            db,
            `SELECT min(substr(submitted_at, 1, 10)) AS d FROM submission WHERE company_id = ? AND person_id IN (${pids.join(",")}) AND disposition IN ('counted','stacked')`,
            id,
          )?.d
        : null;
      if (signup && invite) signupToInvite.push(daysBetween(signup, invite));
      const si = one<{ d: string }>(db, "SELECT min(signed_in_on) AS d FROM first_signin WHERE company_id = ?", id)?.d;
      if (si && invite) inviteToSignin.push(daysBetween(invite, si));
    }
    if (!summary) continue;
    check(`Cohort ${c.number}: users invited`, summary["Users invited"], members.length);
    check(`Cohort ${c.number}: companies`, summary["Companies"], companies.length);
    check(`Cohort ${c.number}: companies signed in`, summary["Companies signed in"], `${signedIn.length} of ${companies.length}`);
    check(`Cohort ${c.number}: median days signup to invite`, summary["Median days signup to invite (per company)"].split(" ")[0], median(signupToInvite) ?? "n/a");
    check(`Cohort ${c.number}: median days invite to first sign-in`, summary["Median days invite to first sign-in"].split(" ")[0], median(inviteToSignin) ?? "n/a");
  }

  // Agent stacks
  for (const row of r.tracker.agentStacks) {
    const n = one<{ n: number }>(db, "SELECT count(*) AS n FROM company_agent_stack cas JOIN agent_stack s ON s.id = cas.stack_id WHERE s.name = ?", row.stack)!.n;
    check(`Agent stack: ${row.stack}`, row.count, n);
  }

  // Fit
  const fit = r.fit.payload;
  check("Fit HTML companies matched", fit.accounts.length, one<{ n: number }>(db, "SELECT count(*) AS n FROM fit_assessment")!.n);
  for (const b of fit.buckets) {
    const expected = fit.accounts.filter((a) => a.bucket === b.id).length;
    const n = one<{ n: number }>(db, "SELECT count(*) AS n FROM fit_assessment WHERE bucket_id = ? AND is_current = 1", b.id)!.n;
    check(`Fit bucket: ${b.label}`, expected, n);
  }
  check("Chase-first list matched", fit.chase.length, one<{ n: number }>(db, "SELECT count(*) AS n FROM company WHERE chase_rank IS NOT NULL")!.n);
  check("Signup-quality rows", fit.quality.length, one<{ n: number }>(db, "SELECT count(*) AS n FROM signup_issue")!.n);

  // Differences worth a look (not failures)
  const findings: string[] = [];
  const unbucketed = all<{ name: string }>(
    db,
    `SELECT c.name FROM company c WHERE NOT EXISTS (SELECT 1 FROM fit_assessment f WHERE f.company_id = c.id) ORDER BY c.id`,
  );
  if (unbucketed.length) findings.push(`**No fit bucket** (the fit HTML is a 2 Nov snapshot): ${unbucketed.map((x) => x.name).join(", ")}.`);

  const stageNow = new Map(all<{ company_id: number; stage: string }>(db, "SELECT company_id, stage FROM stage_event se WHERE id = (SELECT max(id) FROM stage_event WHERE company_id = se.company_id)").map((x) => [x.company_id, x.stage]));
  const stageDiffs: string[] = [];
  const peopleDiffs: string[] = [];
  const ownerDiffs: string[] = [];
  const owners = ownersByCompany(db);
  for (const f of all<{ company_id: number; fit_label: string; name: string }>(db, "SELECT f.company_id, f.fit_label, c.name FROM fit_assessment f JOIN company c ON c.id = f.company_id")) {
    const snap = JSON.parse(f.fit_label) as { stage: string; people: number; owner: string | null };
    const now = stageNow.get(f.company_id) ?? "";
    const norm = (s: string) => s.toLowerCase().replace(/[^a-z]/g, "");
    if (norm(snap.stage) !== norm(now.replace(/_/g, " "))) stageDiffs.push(`${f.name} (fit: ${snap.stage}; now: ${now.replace(/_/g, " ")})`);
    const people = one<{ n: number }>(db, "SELECT count(*) AS n FROM contact WHERE company_id = ? AND role = 'submitter'", f.company_id)!.n;
    if (snap.people !== people) peopleDiffs.push(`${f.name} (fit: ${snap.people}; app: ${people})`);
    const ownerNames = (owners.get(f.company_id) ?? []).map((o) => o.owner_name);
    const fitOwners = (snap.owner ?? "")
      .split(/[;,]\s*/)
      .map((o) => o.replace(/\s*\(.*\)$/, "").trim())
      .filter((o) => o && !/^No Salesforce account$/i.test(o));
    const missing = fitOwners.filter((o) => !ownerNames.includes(o));
    if (missing.length) ownerDiffs.push(`${f.name} (fit names ${missing.join(", ")}; the tracker's owner line doesn't)`);
  }
  if (stageDiffs.length) findings.push(`**Stage moved since the fit snapshot** (${stageDiffs.length}): ${stageDiffs.join("; ")}.`);
  if (peopleDiffs.length) findings.push(`**Submitter count differs from the fit HTML** (${peopleDiffs.length}): ${peopleDiffs.join("; ")}.`);
  if (ownerDiffs.length) findings.push(`**Owner differs from the fit HTML** (${ownerDiffs.length}): ${ownerDiffs.join("; ")}.`);

  const detailOwnerDiffs: string[] = [];
  for (const d of r.tracker.details) {
    const c = one<{ id: number; name: string; sf_lookup_status: string }>(
      db,
      "SELECT c.id, c.name, c.sf_lookup_status FROM company c JOIN company_alias a ON a.company_id = c.id WHERE a.alias = ? LIMIT 1",
      d.company,
    );
    if (!c) continue;
    const expected = splitTopLevel(d.owner, ", ").map((p) => p.replace(/\s*\(.*\)$/, "").trim());
    if (c.sf_lookup_status === "no_account" && /^No account$/i.test(d.owner)) continue;
    if (c.sf_lookup_status === "unassigned" && /^Unassigned$/i.test(d.owner)) continue;
    const actual = [...new Set((owners.get(c.id) ?? []).map((o) => o.owner_name))];
    const missing = expected.filter((e) => !actual.includes(e));
    if (missing.length) detailOwnerDiffs.push(`${c.name} (Details: ${d.owner}; section: ${actual.join(", ") || c.sf_lookup_status})`);
  }
  if (detailOwnerDiffs.length) findings.push(`**Details owner column disagrees with the section's owner line**: ${detailOwnerDiffs.join("; ")}.`);

  const qac = one<{ stage: string }>(db, "SELECT se.stage FROM stage_event se JOIN company c ON c.id = se.company_id WHERE c.name = 'QACooper LLC' ORDER BY se.id DESC LIMIT 1");
  findings.push(`**QACooper LLC** is imported at ${qac?.stage} as the md has it. The fit HTML says the reply was "Thanks" and should not count; change it on the company page if you agree.`);
  findings.push(`**Stanza / Accenture CIO HR Organization** are imported as two companies so the total matches 116. The fit HTML calls the second a Stanza duplicate. Merge them on the company page when you're ready (Replied stays with Stanza).`);
  findings.push(`**Sathish kumar Backiam** is a contact at both Capgemini and The Hartford (unresolved), with a different email at each, so he is two person rows.`);
  findings.push(
    `**Intro arithmetic**: the md says "164 arrived on or before 2026-11-05" and then subtracts to 143, but 143 is 167 - 12 - 11 - 1, i.e. every notification through 2026-11-10. The app's counts match the 167 version.`,
  );
  findings.push(
    `**Excluded and repeat submissions** come from \`src/import/exclusions.json\`, transcribed from the intro paragraph, except Beena P K's repeat, which is in the PVH section. Four Rohan Patil repeats and one Cathy Soller repeat have no recorded date.`,
  );
  findings.push(
    `**Vaibhav Tandale** (AutoZone) has no contacts-CSV row, so he has no email in the app. The md says the address wasn't copied from the inbox; add it on the company page before emailing.`,
  );

  const byKind = (k: string) => r.issues.filter((i) => i.kind === k);
  const failures = checks.filter((c) => !c.ok).length;
  const fmtIssue = (i: (typeof r.issues)[number]) => `- ${i.source}${i.line ? `:${i.line}` : ""}: ${i.message}`;
  const md = [
    `# Import reconciliation`,
    ``,
    `Generated ${new Date().toISOString()} from ${r.dbPath}.`,
    ``,
    `**${checks.length - failures} of ${checks.length} checks match.**`,
    ``,
    `## Checks`,
    ``,
    `| | Check | Source says | App computes | Note |`,
    `|---|---|---|---|---|`,
    ...checks.map((c) => `| ${c.ok ? "ok" : "**DIFF**"} | ${c.what} | ${c.expected} | ${c.actual} | ${c.note ?? ""} |`),
    ``,
    `## Findings to review`,
    ``,
    ...findings.map((f) => `- ${f}`),
    ``,
    `## Rows the import couldn't parse (${byKind("unparsed").length})`,
    ``,
    ...(byKind("unparsed").length ? byKind("unparsed").map(fmtIssue) : ["None."]),
    ``,
    `## Conflicts between sources (${byKind("conflict").length})`,
    ``,
    ...(byKind("conflict").length ? byKind("conflict").map(fmtIssue) : ["None."]),
    ``,
    `## Names or people that matched nothing (${byKind("unmatched").length})`,
    ``,
    ...(byKind("unmatched").length ? byKind("unmatched").map(fmtIssue) : ["None."]),
    ``,
    `## Matched by unique prefix (${byKind("prefix_match").length}, please skim)`,
    ``,
    ...dedupe(byKind("prefix_match").map((i) => `- ${i.message}`)),
    ``,
    `## Other notes (${byKind("note").length})`,
    ``,
    ...(byKind("note").length ? byKind("note").map(fmtIssue) : ["None."]),
    ``,
  ].join("\n");
  return { markdown: md, failures };
}

function dedupe(xs: string[]) {
  return [...new Set(xs)];
}

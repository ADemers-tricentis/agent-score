import { raw } from "hono/html";
import { AUDIT_LOG_PATH, DB_PATH, MAIL_MERGE_PATH, SNAPSHOT_PATH } from "../config.ts";
import { all, one, type DB } from "../db.ts";
import { mailMergeRows } from "../exports.ts";
import { cohorts, growth } from "../read.ts";
import { FUNNEL_STAGES } from "../stages.ts";
import { CompanyLink, lineChart } from "./ui.tsx";
import { today } from "./pages.tsx";

export function GrowthPage({ db }: { db: DB }) {
  const g = growth(db, today());
  const moveStages = FUNNEL_STAGES.filter((s) => s.id !== "interested");
  return (
    <div>
      <p>New companies per week (Monday start), counted from each company's first Interested date, and the stage moves recorded that week.</p>
      {raw(lineChart(g.weeks.map((w) => ({ x: w.week, y: w.cumulative })), { label: "Cumulative companies" }))}
      <p class="small muted">
        Cumulative companies. {g.undatedCompanies} companies have no signup date and are not in the chart. {g.undatedMoves} stage moves have no date.
      </p>
      <table>
        <tr>
          <th>Week of</th>
          <th class="num">New companies</th>
          <th class="num">Cumulative</th>
          {moveStages.map((s) => (
            <th class="num small">{s.label}</th>
          ))}
        </tr>
        {[...g.weeks].reverse().map((w) => (
          <tr>
            <td>{w.week}</td>
            <td class="num">{w.newCompanies || ""}</td>
            <td class="num">{w.cumulative}</td>
            {moveStages.map((s) => (
              <td class="num">{w.moves[s.id] || ""}</td>
            ))}
          </tr>
        ))}
      </table>
    </div>
  );
}

export function UsagePage({ db }: { db: DB }) {
  const cs = cohorts(db);
  const intro = one<{ body_md: string }>(db, "SELECT body_md FROM app_note WHERE key = 'cohorts.intro'")?.body_md;
  const how = one<{ body_md: string }>(db, "SELECT body_md FROM app_note WHERE key = 'cohorts.how_to_update'")?.body_md;
  const using = all<{ id: number; name: string; d: string | null; kind: string | null }>(
    db,
    `SELECT c.id, c.name, (SELECT min(signed_in_on) FROM first_signin WHERE company_id = c.id) AS d,
            (SELECT kind FROM first_signin WHERE company_id = c.id ORDER BY signed_in_on LIMIT 1) AS kind
     FROM company c JOIN stage_event se ON se.id = (SELECT max(id) FROM stage_event WHERE company_id = c.id)
     WHERE se.stage = 'actively_using' AND c.merged_into_id IS NULL AND c.excluded_reason IS NULL`,
  );
  const fmtRange = (r: [number, number] | null) => (r ? `${r[0]}–${r[1]} days` : "");
  return (
    <div>
      {intro && <p>{intro}</p>}
      <table>
        <tr>
          <th>Cohort</th>
          <th>Invite sent</th>
          <th class="num">Users</th>
          <th class="num">Companies</th>
          <th class="num">Signed in</th>
          <th class="num">Median signup to invite</th>
          <th>Range</th>
          <th class="num">Median invite to first sign-in</th>
        </tr>
        {cs.map((c) => (
          <tr>
            <td>
              <a href={`#cohort-${c.number}`}>Cohort {c.number}</a>
            </td>
            <td>{c.invite_sent_on ?? ""}</td>
            <td class="num">{c.users}</td>
            <td class="num">{c.rows.length}</td>
            <td class="num">{c.signedIn}</td>
            <td class="num">{c.medianSignupToInvite ?? ""}</td>
            <td>{fmtRange(c.rangeSignupToInvite)}</td>
            <td class="num">{c.medianInviteToSignin ?? ""}</td>
          </tr>
        ))}
      </table>
      {cs.map((c) => (
        <div id={`cohort-${c.number}`}>
          <h2>Cohort {c.number}</h2>
          {c.how_chosen && <p>{c.how_chosen}</p>}
          <table>
            <tr>
              <th>Company</th>
              <th>Users</th>
              <th>Signup</th>
              <th>Demo scheduled</th>
              <th>Invite sent</th>
              <th class="num">Days signup to invite</th>
              <th>First sign-in</th>
              <th class="num">Days invite to sign-in</th>
            </tr>
            {c.rows.map((r) => (
              <tr>
                <td>
                  <CompanyLink id={r.company_id} name={r.company} />
                </td>
                <td>{r.users.join(", ")}</td>
                <td>{r.signup ?? ""}</td>
                <td>{r.scheduled ?? ""}</td>
                <td>{r.invite ?? ""}</td>
                <td class="num">{r.daysSignupToInvite ?? ""}</td>
                <td>
                  {r.firstSignin ?? ""}
                  {r.signinKind === "reported_use" && <span class="muted small"> (reported)</span>}
                </td>
                <td class="num">{r.daysInviteToSignin ?? ""}</td>
              </tr>
            ))}
          </table>
          {c.notes_md && <pre>{c.notes_md}</pre>}
        </div>
      ))}
      <h2>Actively using</h2>
      <table>
        <tr>
          <th>Company</th>
          <th>First sign-in</th>
        </tr>
        {using.map((u) => (
          <tr>
            <td>
              <CompanyLink id={u.id} name={u.name} />
            </td>
            <td>
              {u.d ?? <span class="muted">not recorded</span>}
              {u.kind === "reported_use" && <span class="muted small"> (reported)</span>}
            </td>
          </tr>
        ))}
      </table>
      <p class="small muted">Record a sign-in from the company page. Reported use means someone told us they use it; product login means we saw the sign-in.</p>
      {how && (
        <details>
          <summary>How the cohort table was maintained before the app</summary>
          <pre>{how}</pre>
        </details>
      )}
    </div>
  );
}

export function SubmissionsPage({ db, disposition }: { db: DB; disposition?: string }) {
  const counts = all<{ disposition: string; n: number }>(db, "SELECT disposition, count(*) AS n FROM submission GROUP BY disposition ORDER BY disposition");
  const rows = all<{ id: number; submitted_at: string | null; person_name: string; company_id: number | null; company: string | null; form_company_field: string | null; disposition: string; disposition_rule: string | null; reason: string | null; source: string }>(
    db,
    `SELECT s.id, s.submitted_at, s.person_name, s.company_id, c.name AS company, s.form_company_field, s.disposition, s.disposition_rule, s.reason, s.source
     FROM submission s LEFT JOIN company c ON c.id = s.company_id
     WHERE s.disposition = coalesce(?, s.disposition) AND (? IS NOT NULL OR s.disposition NOT IN ('counted', 'stacked'))
     ORDER BY coalesce(s.submitted_at, '0') DESC, s.id DESC`,
    disposition ?? null,
    disposition ?? null,
  );
  return (
    <div>
      <p>
        Every form submission is kept. Counted submissions created a company; stacked ones added a person to a company already tracked. This page shows the rest by default:
        excluded, repeat and held submissions, each with its reason.
      </p>
      <p>
        <a class={`pill ${!disposition ? "on" : ""}`} href="/submissions">
          Not counted
        </a>
        {counts.map((c) => (
          <a class={`pill ${disposition === c.disposition ? "on" : ""}`} href={`/submissions?d=${c.disposition}`}>
            {c.disposition} ({c.n})
          </a>
        ))}
      </p>
      <table>
        <tr>
          <th>Submitted</th>
          <th>Name</th>
          <th>Company</th>
          <th>Form company field</th>
          <th>Disposition</th>
          <th>Reason</th>
        </tr>
        {rows.map((r) => (
          <tr>
            <td>{r.submitted_at ?? <span class="muted">not recorded</span>}</td>
            <td>{r.person_name}</td>
            <td>{r.company_id ? <CompanyLink id={r.company_id} name={r.company!} /> : ""}</td>
            <td>{r.form_company_field ?? ""}</td>
            <td>
              {r.disposition}
              {r.disposition_rule ? ` (${r.disposition_rule.replace(/_/g, " ")})` : ""}
            </td>
            <td class="small">{r.reason ?? ""}</td>
          </tr>
        ))}
      </table>
    </div>
  );
}

export function ActivityPage({ db, f }: { db: DB; f: { actor?: string; run?: string } }) {
  const runs = all<{ id: number; kind: string; dry_run: number; actor: string; started_at: string; finished_at: string | null; status: string; summary_md: string | null; n: number }>(
    db,
    "SELECT r.*, (SELECT count(*) FROM change_log WHERE run_id = r.id) AS n FROM sync_run r ORDER BY id DESC LIMIT 50",
  );
  const changes = all<{ id: number; at: string; actor: string; run_id: number | null; entity: string; action: string; company_id: number | null; company: string | null; before_json: string | null; after_json: string | null; reason: string | null }>(
    db,
    `SELECT cl.*, c.name AS company FROM change_log cl LEFT JOIN company c ON c.id = cl.company_id
     WHERE cl.actor <> 'import' AND cl.actor = coalesce(?, cl.actor) AND coalesce(cl.run_id, -1) = coalesce(?, coalesce(cl.run_id, -1))
     ORDER BY cl.id DESC LIMIT 500`,
    f.actor || null,
    f.run ? Number(f.run) : null,
  );
  const importCount = one<{ n: number }>(db, "SELECT count(*) AS n FROM change_log WHERE actor = 'import'")!.n;
  return (
    <div>
      <h2>Runs</h2>
      <table>
        <tr>
          <th>Run</th>
          <th>Kind</th>
          <th>Actor</th>
          <th>Started</th>
          <th>Finished</th>
          <th>Status</th>
          <th class="num">Changes</th>
          <th>Summary</th>
        </tr>
        {runs.map((r) => (
          <tr>
            <td>
              <a href={`/activity?run=${r.id}`}>{r.id}</a>
            </td>
            <td>
              {r.kind}
              {r.dry_run ? " (dry run)" : ""}
            </td>
            <td>{r.actor}</td>
            <td class="small">{r.started_at}</td>
            <td class="small">{r.finished_at ?? ""}</td>
            <td>{r.status}</td>
            <td class="num">{r.n}</td>
            <td class="small">
              {r.summary_md && (
                <details>
                  <summary>show</summary>
                  <pre>{r.summary_md}</pre>
                </details>
              )}
            </td>
          </tr>
        ))}
      </table>
      <h2>Changes {f.run ? `in run ${f.run}` : f.actor ? `by ${f.actor}` : ""}</h2>
      <p>
        <a class={`pill ${!f.actor && !f.run ? "on" : ""}`} href="/activity">
          All
        </a>
        {["user", "sync-agent", "cli"].map((a) => (
          <a class={`pill ${f.actor === a ? "on" : ""}`} href={`/activity?actor=${a}`}>
            {a}
          </a>
        ))}
        <span class="small muted"> The import wrote {importCount} rows; they are not listed.</span>
      </p>
      <table>
        <tr>
          <th>When</th>
          <th>Actor</th>
          <th>Company</th>
          <th>Change</th>
          <th>Detail</th>
        </tr>
        {changes.map((c) => (
          <tr>
            <td class="small">{c.at}</td>
            <td class="small">
              {c.actor}
              {c.run_id ? ` (run ${c.run_id})` : ""}
            </td>
            <td>{c.company_id ? <CompanyLink id={c.company_id} name={c.company ?? String(c.company_id)} /> : ""}</td>
            <td>
              {c.entity} {c.action}
            </td>
            <td class="small">
              {c.before_json ?? ""} → {c.after_json ?? ""}
              {c.reason && <div>reason: {c.reason}</div>}
            </td>
          </tr>
        ))}
      </table>
    </div>
  );
}

export function ExportsPage({ db }: { db: DB }) {
  const mm = mailMergeRows(db, { allUnemailed: true });
  return (
    <div>
      <h2>Mail merge</h2>
      <p>
        Same format as <code>external-interest-contacts.csv</code>: Company, Name, Email, Status, every field quoted. This list is every company still at Interested whose primary
        contact has an email and is not marked do not email.
      </p>
      <table>
        <tr>
          <th>Company</th>
          <th>Name</th>
          <th>Email</th>
          <th>Status</th>
        </tr>
        {mm.rows.map((r) => (
          <tr>
            <td>{r.company}</td>
            <td>{r.name}</td>
            <td>{r.email}</td>
            <td>{r.status}</td>
          </tr>
        ))}
      </table>
      {mm.skipped.length > 0 && <p class="small muted">Skipped: {mm.skipped.join("; ")}</p>}
      <p>
        <a href="/exports/mail-merge.csv">Download CSV</a>{" "}
        <form method="post" action="/exports/mail-merge" class="inline">
          <button>Write to {MAIL_MERGE_PATH}</button>
        </form>
      </p>
      {mm.rows.length > 0 && (
        <form method="post" action="/exports/mark-emailed">
          After sending: record the intro email to these {mm.rows.length} contacts on <input type="date" name="date" value={today()} /> <button>Mark as emailed</button>
        </form>
      )}
      <h2>Snapshot</h2>
      <p>
        The read-only markdown snapshot for skills that read the tracker is rewritten after every change. Path: <code>{SNAPSHOT_PATH}</code>
      </p>
      <form method="post" action="/exports/snapshot">
        <button>Regenerate now</button>
      </form>
      <h2>Backup</h2>
      <p>
        Database: <code>{DB_PATH}</code>. Backups go to <code>backups/</code> in the app folder.
      </p>
      <form method="post" action="/exports/backup">
        <button>Back up now</button>
      </form>
      <h2>Paths</h2>
      <p class="small">
        Audit log: <code>{AUDIT_LOG_PATH}</code>
      </p>
    </div>
  );
}

export function NotesPage({ db }: { db: DB }) {
  const notes = all<{ key: string; body_md: string; updated_at: string }>(db, "SELECT * FROM app_note ORDER BY key");
  return (
    <div>
      <p>Page text carried over from the tracker, the cohort doc and the fit page. Edit it here; the snapshot and pages use it.</p>
      {notes.map((n) => (
        <fieldset>
          <legend>
            {n.key} <span class="muted small">({n.updated_at})</span>
          </legend>
          <form method="post" action="/notes">
            <input type="hidden" name="key" value={n.key} />
            <textarea name="body" style="min-height:90px">
              {n.body_md}
            </textarea>
            <button>Save</button>
          </form>
        </fieldset>
      ))}
    </div>
  );
}
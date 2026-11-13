import { raw } from "hono/html";
import { all, one, type DB } from "../db.ts";
import { leads, ownerText, type Lead } from "../read.ts";
import { stageLabel } from "../stages.ts";
import { bar, CompanyLink } from "./ui.tsx";

const ICP = ["motivated", "silent-customer", "silent-partner"];
const note = (db: DB, key: string) => one<{ body_md: string }>(db, "SELECT body_md FROM app_note WHERE key = ?", key)?.body_md ?? "";

/** Live counts for insights whose definition can be read off the data. Others show the imported count. */
function liveInsightCount(title: string, ls: Lead[], signedIn: Set<number>): number | null {
  const icp = ls.filter((l) => l.bucket_id && ICP.includes(l.bucket_id));
  if (/never mailed/i.test(title)) return icp.filter((l) => l.stage === "interested").length;
  if (/invited, never signed in/i.test(title)) return ls.filter((l) => l.stage === "invited_to_beta" && !signedIn.has(l.id)).length;
  if (/replied, not on a calendar/i.test(title)) return icp.filter((l) => l.stage === "replied").length;
  return null;
}

export function FitPage({ db, f }: { db: DB; f: { fit?: string; q?: string; quality?: string } }) {
  const ls = leads(db, { includeInactive: false });
  const buckets = all<{ id: string; label: string; short_label: string }>(db, "SELECT id, label, short_label FROM fit_bucket ORDER BY sort");
  const signedIn = new Set(all<{ company_id: number }>(db, "SELECT DISTINCT company_id FROM first_signin").map((r) => r.company_id));
  const count = (ids: string[]) => ls.filter((l) => l.bucket_id && ids.includes(l.bucket_id)).length;
  const invited = ls.filter((l) => ["invited_to_beta", "actively_using"].includes(l.stage));
  const invitedSignedIn = invited.filter((l) => signedIn.has(l.id)).length;
  const bucketCounts = buckets.map((b) => ({ ...b, n: ls.filter((l) => l.bucket_id === b.id).length }));
  const unbucketed = ls.filter((l) => !l.bucket_id);
  const maxN = Math.max(1, ...bucketCounts.map((b) => b.n));
  const fitRow = new Map(
    all<{ company_id: number; evidence: string | null; why: string | null }>(db, "SELECT company_id, evidence, why FROM fit_assessment WHERE is_current = 1").map((r) => [r.company_id, r]),
  );
  const byId = new Map(ls.map((l) => [l.id, l]));

  const chase = ls.filter((l) => l.chase_rank).sort((a, b) => a.chase_rank! - b.chase_rank!);

  const ownerRows = all<{ owner: string; account: string; company_id: number; company: string; label: string | null }>(
    db,
    `SELECT DISTINCT a.owner_name AS owner, a.name AS account, c.id AS company_id, c.name AS company, csa.label
     FROM company c JOIN fit_assessment fa ON fa.company_id = c.id AND fa.is_current = 1
     JOIN company_sf_account csa ON csa.company_id = c.id JOIN sf_account a ON a.id = csa.sf_account_id
     WHERE fa.bucket_id IN (${ICP.map(() => "?").join(",")}) AND c.merged_into_id IS NULL AND c.excluded_reason IS NULL`,
    ...ICP,
  );
  const noAccount = ls.filter((l) => l.bucket_id && ICP.includes(l.bucket_id) && l.sf_lookup_status !== "matched");
  const owners = new Map<string, typeof ownerRows>();
  for (const r of ownerRows) owners.set(r.owner, [...(owners.get(r.owner) ?? []), r]);
  const ownerList = [...owners.entries()].sort((a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0]));

  const insights = all<{ id: number; title: string; count_text: string | null; action_md: string | null }>(db, "SELECT * FROM funnel_insight ORDER BY sort");
  const insightCos = all<{ insight_id: number; company_id: number; name: string }>(
    db,
    "SELECT fic.insight_id, c.id AS company_id, c.name FROM funnel_insight_company fic JOIN company c ON c.id = fic.company_id",
  );
  const issues = all<{ kind: string; who: string; when_text: string | null; detail: string | null; company_id: number | null }>(
    db,
    "SELECT kind, who, when_text, detail, company_id FROM signup_issue ORDER BY sort, id",
  );
  const issueKinds = [
    { id: "no_company", label: "No usable company" },
    { id: "internal", label: "Internal or test" },
    { id: "duplicate", label: "Duplicate submission" },
  ];
  const excludedSubs = one<{ n: number }>(db, "SELECT count(*) AS n FROM submission WHERE disposition = 'excluded'")!.n;
  const repeatSubs = one<{ n: number }>(db, "SELECT count(*) AS n FROM submission WHERE disposition = 'repeat'")!.n;

  const q = f.q?.trim().toLowerCase();
  const every = ls.filter((l) => (f.fit === "none" ? !l.bucket_id : !f.fit || l.bucket_id === f.fit) && (!q || l.name.toLowerCase().includes(q) || (l.contacts ?? "").toLowerCase().includes(q)));
  const qs = (patch: Record<string, string | undefined>) => {
    const p = new URLSearchParams(Object.entries({ ...f, ...patch }).filter(([, v]) => v) as [string, string][]);
    return `/fit?${p.toString()}`;
  };

  return (
    <div>
      <p>{note(db, "fit.agentscore_interest_sorted_by_fit")}</p>
      <p class="small muted">{note(db, "fit.agentscore_interest_sorted_by_fit.2")}</p>
      <p class="small muted">Counts on this page are computed from the current data: {ls.length} active companies.</p>
      <table>
        <tr>
          <th class="num">{count(["motivated"])}</th>
          <th class="num">{count(["silent-customer", "silent-partner"])}</th>
          <th class="num">{count(["not-now"])}</th>
          <th class="num">
            {invitedSignedIn} / {invited.length}
          </th>
        </tr>
        <tr>
          <td>ICP and motivated</td>
          <td>ICP, no real reply</td>
          <td>Not building agents yet</td>
          <td>Beta invites with a sign-in</td>
        </tr>
      </table>

      <h3>Companies in each fit bucket</h3>
      <table>
        {bucketCounts.map((b) => (
          <tr>
            <td>
              <a href={qs({ fit: b.id })}>{b.label}</a>
            </td>
            <td class="num">{b.n}</td>
            <td>{raw(bar(b.n, maxN))}</td>
          </tr>
        ))}
        {unbucketed.length > 0 && (
          <tr>
            <td>
              <a href={qs({ fit: "none" })}>No bucket yet</a>
            </td>
            <td class="num">{unbucketed.length}</td>
            <td class="small">{unbucketed.map((l) => l.name).join(", ")}</td>
          </tr>
        )}
      </table>
      <p class="small muted">{note(db, "fit.companies_in_each_fit_bucket")}</p>
      <h3>Where the funnel is actually leaking</h3>
      <p>{note(db, "fit.where_the_funnel_is_actually_leaking")}</p>
      <p class="small muted">
        Live: {count(["silent-customer"])} silent end customers; {invited.length} beta invites, {invitedSignedIn} with a sign-in.
      </p>

      <h2>Chase these first</h2>
      <p>{note(db, "fit.chase_these_first")}</p>
      <table>
        <tr>
          <th>#</th>
          <th>Company</th>
          <th>Status</th>
          <th>Evidence</th>
          <th>Why</th>
          <th>Owner</th>
        </tr>
        {chase.map((l) => (
          <tr>
            <td>{l.chase_rank}</td>
            <td>
              <CompanyLink id={l.id} name={l.name} />
            </td>
            <td>{stageLabel(l.stage)}</td>
            <td>{fitRow.get(l.id)?.evidence ?? ""}</td>
            <td class="small">{fitRow.get(l.id)?.why ?? ""}</td>
            <td>{ownerText(l)}</td>
          </tr>
        ))}
      </table>

      <h2>Accounts by owner</h2>
      <p>{note(db, "fit.accounts_by_owner")}</p>
      <table>
        <tr>
          <th>Owner</th>
          <th>Account</th>
          <th>Company</th>
          <th>Bucket</th>
          <th>Status</th>
        </tr>
        {ownerList.flatMap(([owner, rows]) =>
          rows.map((r, i) => (
            <tr>
              {i === 0 && (
                <td rowspan={rows.length}>
                  {owner} <span class="muted">({rows.length})</span>
                </td>
              )}
              <td>
                {r.account}
                {r.label ? <span class="muted small"> ({r.label})</span> : ""}
              </td>
              <td>
                <CompanyLink id={r.company_id} name={r.company} />
              </td>
              <td>{byId.get(r.company_id)?.bucket ?? ""}</td>
              <td>{stageLabel(byId.get(r.company_id)?.stage ?? "")}</td>
            </tr>
          )),
        )}
        {noAccount.map((l, i) => (
          <tr>
            {i === 0 && (
              <td rowspan={noAccount.length}>
                No Salesforce account <span class="muted">({noAccount.length})</span>
              </td>
            )}
            <td class="muted">{ownerText(l)}</td>
            <td>
              <CompanyLink id={l.id} name={l.name} />
            </td>
            <td>{l.bucket}</td>
            <td>{stageLabel(l.stage)}</td>
          </tr>
        ))}
      </table>

      <h2>What would move the funnel</h2>
      <table>
        <tr>
          <th>Insight</th>
          <th class="num">Count (as written)</th>
          <th class="num">Count now</th>
          <th>Action</th>
          <th>Companies</th>
        </tr>
        {insights.map((i) => {
          const live = liveInsightCount(i.title, ls, signedIn);
          return (
            <tr>
              <td>{i.title}</td>
              <td class="num">{i.count_text ?? ""}</td>
              <td class="num">{live ?? <span class="muted">n/a</span>}</td>
              <td class="small">{i.action_md ?? ""}</td>
              <td class="small">
                {insightCos
                  .filter((c) => c.insight_id === i.id)
                  .map((c) => (
                    <span>
                      <CompanyLink id={c.company_id} name={c.name} />{" "}
                    </span>
                  ))}
              </td>
            </tr>
          );
        })}
      </table>
      <p class="small muted">"Count now" is computed only where the insight has a clear rule. The others are editorial and keep the count as written.</p>

      <h2>Signup quality</h2>
      <p>{note(db, "fit.signup_quality")}</p>
      <p class="small muted">
        In the data: {excludedSubs} excluded submissions and {repeatSubs} repeat submissions. <a href="/submissions">See all</a>.
      </p>
      <p>
        <a class={`pill ${!f.quality ? "on" : ""}`} href={qs({ quality: undefined })}>
          All ({issues.length})
        </a>
        {issueKinds.map((k) => (
          <a class={`pill ${f.quality === k.id ? "on" : ""}`} href={qs({ quality: k.id })}>
            {k.label} ({issues.filter((i) => i.kind === k.id).length})
          </a>
        ))}
      </p>
      <table>
        <tr>
          <th>Kind</th>
          <th>Who</th>
          <th>When</th>
          <th>Detail</th>
        </tr>
        {issues
          .filter((i) => !f.quality || i.kind === f.quality)
          .map((i) => (
            <tr>
              <td>{issueKinds.find((k) => k.id === i.kind)?.label}</td>
              <td>{i.company_id ? <CompanyLink id={i.company_id} name={i.who} /> : i.who}</td>
              <td>{i.when_text ?? ""}</td>
              <td class="small">{i.detail ?? ""}</td>
            </tr>
          ))}
      </table>

      <h2 id="every">Every company</h2>
      <p>
        <a class={`pill ${!f.fit ? "on" : ""}`} href={qs({ fit: undefined }) + "#every"}>
          All ({ls.length})
        </a>
        {bucketCounts.map((b) => (
          <a class={`pill ${f.fit === b.id ? "on" : ""}`} href={qs({ fit: b.id }) + "#every"}>
            {b.short_label} ({b.n})
          </a>
        ))}
        <a class={`pill ${f.fit === "none" ? "on" : ""}`} href={qs({ fit: "none" }) + "#every"}>
          No bucket ({unbucketed.length})
        </a>
      </p>
      <form method="get" action="/fit#every">
        {f.fit && <input type="hidden" name="fit" value={f.fit} />}
        <input name="q" value={f.q ?? ""} placeholder="Search company or person" /> <button>Search</button>
      </form>
      <table>
        <tr>
          <th>Company</th>
          <th>Bucket</th>
          <th class="num">People</th>
          <th>Status</th>
          <th>Evidence</th>
          <th>Why</th>
          <th>Owner</th>
        </tr>
        {every.map((l) => (
          <tr>
            <td>
              <CompanyLink id={l.id} name={l.name} />
            </td>
            <td>{l.bucket ?? ""}</td>
            <td class="num">{l.people}</td>
            <td>{stageLabel(l.stage)}</td>
            <td>{fitRow.get(l.id)?.evidence ?? ""}</td>
            <td class="small">{fitRow.get(l.id)?.why ?? ""}</td>
            <td>{l.bucket_id && ICP.includes(l.bucket_id) ? ownerText(l) : ""}</td>
          </tr>
        ))}
      </table>
    </div>
  );
}

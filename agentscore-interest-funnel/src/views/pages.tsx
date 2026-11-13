import { raw } from "hono/html";
import { mentions } from "../auditlog.ts";
import { all, one, type DB } from "../db.ts";
import { companiesAtStage, funnelCounts } from "../queries.ts";
import { leads, noReplyDays, ownerText, timeline, type Lead } from "../read.ts";
import { statusText } from "../snapshot.ts";
import { stageLabel } from "../stages.ts";
import { CompanyLink, Md, StageSelect } from "./ui.tsx";

export const today = () => new Date().toISOString().slice(0, 10);

export function FunnelPage({ db }: { db: DB }) {
  const counts = funnelCounts(db);
  const exits = all<{ company_id: number; name: string; stage: string; occurred_on: string | null; note: string | null }>(
    db,
    `SELECT c.id AS company_id, c.name, se.stage, se.occurred_on, se.note FROM company c
     JOIN stage_event se ON se.id = (SELECT max(id) FROM stage_event WHERE company_id = c.id)
     WHERE se.stage IN ('not_a_fit', 'do_not_email') AND c.merged_into_id IS NULL`,
  );
  const max = Math.max(...counts.stages.map((s) => s.cumulative));
  return (
    <div>
      <p>
        {counts.total} companies in the funnel. Current counts companies whose latest stage is that stage; cumulative counts companies at that stage or a later one.
      </p>
      <table>
        <tr>
          <th>Stage</th>
          <th class="num">Current</th>
          <th class="num">Cumulative</th>
          <th></th>
        </tr>
        {counts.stages.map((s) => (
          <tr>
            <td>{s.label}</td>
            <td class="num">
              <a href={`/stage/${s.id}?mode=current`}>{s.current}</a>
            </td>
            <td class="num">
              <a href={`/stage/${s.id}?mode=cumulative`}>{s.cumulative}</a>
            </td>
            <td>{raw(`<svg width="300" height="12"><rect width="${Math.max(2, Math.round((s.cumulative / max) * 300))}" height="12" fill="#2a6ebb"/></svg>`)}</td>
          </tr>
        ))}
      </table>
      <h2>Outside the funnel</h2>
      <table>
        <tr>
          <th>Company</th>
          <th>State</th>
          <th>Since</th>
          <th>Reason</th>
        </tr>
        {exits.map((e) => (
          <tr>
            <td>
              <CompanyLink id={e.company_id} name={e.name} />
            </td>
            <td>{stageLabel(e.stage)}</td>
            <td>{e.occurred_on ?? ""}</td>
            <td>{e.note ?? ""}</td>
          </tr>
        ))}
      </table>
    </div>
  );
}

export function StagePage({ db, stage, mode }: { db: DB; stage: string; mode: "current" | "cumulative" }) {
  const rows = companiesAtStage(db, stage, mode);
  const byId = new Map(leads(db).map((l) => [l.id, l]));
  return (
    <div>
      <p>
        {rows.length} companies {mode === "current" ? "currently at" : "at or past"} {stageLabel(stage)}.{" "}
        <a href={`/stage/${stage}?mode=${mode === "current" ? "cumulative" : "current"}`}>Show {mode === "current" ? "cumulative" : "current"}</a>
      </p>
      <LeadTable rows={rows.map((r) => byId.get(r.company_id)!).filter(Boolean)} />
    </div>
  );
}

export function LeadTable({ rows, showNoReply }: { rows: Lead[]; showNoReply?: boolean }) {
  const t = today();
  return (
    <table>
      <tr>
        <th>Company</th>
        <th>Status</th>
        <th>Fit</th>
        <th>Owner</th>
        <th>Relationship</th>
        <th>Signup</th>
        <th class="num">People</th>
        <th>Last outreach</th>
        {showNoReply && <th class="num">Days without reply</th>}
      </tr>
      {rows.map((l) => (
        <tr>
          <td>
            <CompanyLink id={l.id} name={l.name} />
            {l.excluded_reason && <span class="muted small"> (excluded)</span>}
          </td>
          <td>{statusText(l)}</td>
          <td>{l.bucket ?? <span class="muted">none</span>}</td>
          <td>{ownerText(l)}</td>
          <td>{l.rels ?? ""}</td>
          <td>{l.signup ?? (l.source !== "form" ? <span class="muted">{l.source}</span> : "")}</td>
          <td class="num">{l.people}</td>
          <td>{l.last_out ?? ""}</td>
          {showNoReply && <td class="num">{noReplyDays(l, t) ?? ""}</td>}
        </tr>
      ))}
    </table>
  );
}

export type LeadFilters = { q?: string; stage?: string; fit?: string; owner?: string; rel?: string; from?: string; to?: string; noreply?: string; include?: string };

export function filterLeads(db: DB, f: LeadFilters): Lead[] {
  const t = today();
  const q = f.q?.trim().toLowerCase();
  const aliasHits = q
    ? new Set(all<{ company_id: number }>(db, "SELECT DISTINCT company_id FROM company_alias WHERE lower(alias) LIKE ?", `%${q}%`).map((r) => r.company_id))
    : null;
  return leads(db, { includeInactive: f.include === "1" }).filter((l) => {
    if (q && !(aliasHits!.has(l.id) || (l.contacts ?? "").toLowerCase().includes(q) || ownerText(l).toLowerCase().includes(q))) return false;
    if (f.stage && l.stage !== f.stage) return false;
    if (f.fit === "none" ? l.bucket_id : f.fit && l.bucket_id !== f.fit) return false;
    if (f.owner && !ownerText(l).toLowerCase().includes(f.owner.toLowerCase())) return false;
    if (f.rel && !(l.rels ?? "").toLowerCase().includes(f.rel.toLowerCase())) return false;
    if (f.from && (!l.signup || l.signup < f.from)) return false;
    if (f.to && (!l.signup || l.signup > f.to)) return false;
    if (f.noreply) {
      const d = noReplyDays(l, t);
      if (d === null || d < Number(f.noreply)) return false;
    }
    return true;
  });
}

export function LeadsPage({ db, f }: { db: DB; f: LeadFilters }) {
  const rows = filterLeads(db, f);
  const buckets = all<{ id: string; short_label: string }>(db, "SELECT id, short_label FROM fit_bucket ORDER BY sort");
  const owners = [...new Set(leads(db).flatMap((l) => l.owners.map((o) => o.owner_name)).filter(Boolean))].sort() as string[];
  const csvHref = `/leads.csv?${new URLSearchParams(Object.entries(f).filter(([, v]) => v) as [string, string][]).toString()}`;
  return (
    <div>
      <form method="get">
        <fieldset>
          <legend>Filter</legend>
          <label>
            Search <input name="q" value={f.q ?? ""} />
          </label>
          <label>
            Stage <StageSelect name="stage" value={f.stage} blank="any" />
          </label>
          <label>
            Fit{" "}
            <select name="fit">
              <option value="">any</option>
              <option value="none" selected={f.fit === "none"}>
                no bucket
              </option>
              {buckets.map((b) => (
                <option value={b.id} selected={f.fit === b.id}>
                  {b.short_label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Owner{" "}
            <select name="owner">
              <option value="">any</option>
              {owners.map((o) => (
                <option selected={f.owner === o}>{o}</option>
              ))}
            </select>
          </label>
          <label>
            Relationship{" "}
            <select name="rel">
              <option value="">any</option>
              {["Customer", "Partner", "Evaluating Tricentis"].map((r) => (
                <option selected={f.rel === r}>{r}</option>
              ))}
            </select>
          </label>
          <label>
            Signup from <input type="date" name="from" value={f.from ?? ""} />
          </label>
          <label>
            to <input type="date" name="to" value={f.to ?? ""} />
          </label>
          <label>
            No reply in <input name="noreply" size={3} value={f.noreply ?? ""} /> days
          </label>
          <label>
            <input type="checkbox" name="include" value="1" checked={f.include === "1"} /> include excluded
          </label>
          <button>Apply</button> <a href="/leads">Reset</a>
        </fieldset>
      </form>
      <p>
        {rows.length} companies. <a href={csvHref}>Download as CSV</a>
      </p>
      <LeadTable rows={rows} showNoReply={!!f.noreply} />
    </div>
  );
}

export function CompanyPage({ db, id }: { db: DB; id: number }) {
  const c = one<{
    id: number;
    name: string;
    source: string;
    source_detail: string | null;
    sf_lookup_status: string;
    sf_owner_raw: string | null;
    chase_rank: number | null;
    merged_into_id: number | null;
    excluded_reason: string | null;
    primary_person_id: number | null;
    import_raw_md: string | null;
  }>(db, "SELECT * FROM company WHERE id = ?", id);
  if (!c) return <p>No company {id}.</p>;
  const lead = leads(db, { includeInactive: true }).find((l) => l.id === id);
  const merged = c.merged_into_id ? one<{ id: number; name: string }>(db, "SELECT id, name FROM company WHERE id = ?", c.merged_into_id) : null;
  const fit = one<{ bucket_id: string; label: string; evidence: string | null; why: string | null; assessed_on: string | null; actor: string }>(
    db,
    "SELECT fa.bucket_id, fb.label, fa.evidence, fa.why, fa.assessed_on, fa.actor FROM fit_assessment fa JOIN fit_bucket fb ON fb.id = fa.bucket_id WHERE fa.company_id = ? AND fa.is_current = 1",
    id,
  );
  const buckets = all<{ id: string; label: string }>(db, "SELECT id, label FROM fit_bucket ORDER BY sort");
  const contacts = all<{ person_id: number; name: string; email: string | null; role: string; status: string; status_note: string | null; dne: string | null; dne_on: string | null; excluded: string | null; note: string | null }>(
    db,
    `SELECT p.id AS person_id, p.name, p.email, ct.role, ct.status, ct.status_note, p.do_not_email_reason AS dne, p.do_not_email_on AS dne_on,
            ct.outreach_excluded_reason AS excluded, ct.note
     FROM contact ct JOIN person p ON p.id = ct.person_id WHERE ct.company_id = ? ORDER BY ct.id`,
    id,
  );
  const subs = all<{ id: number; submitted_at: string | null; person_name: string; title: string | null; relationship: string | null; form_company_field: string | null; disposition: string; disposition_rule: string | null; reason: string | null; comments: string | null }>(
    db,
    "SELECT * FROM submission WHERE company_id = ? ORDER BY coalesce(submitted_at, '9999'), id",
    id,
  );
  const research = all<{ id: number; field: string; label_raw: string; body_md: string; as_of: string | null; actor: string }>(
    db,
    "SELECT * FROM research_field WHERE company_id = ? ORDER BY sort, id",
    id,
  );
  const sources = all<{ research_field_id: number; url: string; link_text: string | null }>(
    db,
    "SELECT rs.* FROM research_source rs JOIN research_field rf ON rf.id = rs.research_field_id WHERE rf.company_id = ?",
    id,
  );
  const accounts = all<{ account: string; type: string | null; owner_name: string; person: string | null; person_email: string | null; match_method: string | null; label: string | null; note: string | null }>(
    db,
    `SELECT a.name AS account, a.type, a.owner_name, p.name AS person, p.email AS person_email, csa.match_method, csa.label, csa.note
     FROM company_sf_account csa JOIN sf_account a ON a.id = csa.sf_account_id LEFT JOIN person p ON p.id = csa.person_id WHERE csa.company_id = ? ORDER BY csa.id`,
    id,
  );
  const stacks = all<{ name: string; qualifier: string | null }>(
    db,
    "SELECT s.name, cas.qualifier FROM company_agent_stack cas JOIN agent_stack s ON s.id = cas.stack_id WHERE cas.company_id = ?",
    id,
  );
  const links = all<{ kind: string; label: string | null; path_or_url: string }>(db, "SELECT kind, label, path_or_url FROM company_link WHERE company_id = ?", id);
  const aliases = all<{ alias: string; origin: string }>(db, "SELECT alias, origin FROM company_alias WHERE company_id = ?", id);
  const changes = all<{ at: string; actor: string; entity: string; action: string; before_json: string | null; after_json: string | null; reason: string | null; run_id: number | null }>(
    db,
    "SELECT at, actor, entity, action, before_json, after_json, reason, run_id FROM change_log WHERE company_id = ? AND action <> 'import' ORDER BY id DESC LIMIT 200",
    id,
  );
  const audit = mentions([c.name, ...aliases.map((a) => a.alias).filter((a) => a.length >= 4)]);
  const others = all<{ id: number; name: string }>(db, "SELECT id, name FROM company WHERE id <> ? AND merged_into_id IS NULL ORDER BY name", id);
  const accountJson = JSON.stringify(
    {
      status: c.sf_lookup_status,
      accounts: accounts.map((a) => ({ account: a.account, type: a.type, owner: a.owner_name, person: a.person_email ?? a.person, match_method: a.match_method, label: a.label, note: a.note })),
      note: c.sf_owner_raw,
    },
    null,
    2,
  );
  const post = (path: string) => `/company/${id}/${path}`;
  const t = today();

  return (
    <div>
      {merged && (
        <p class="flash err">
          Merged into <CompanyLink id={merged.id} name={merged.name} />. This record is kept for history.
        </p>
      )}
      {c.excluded_reason && <p class="flash err">Excluded: {c.excluded_reason}</p>}
      <table>
        <tr>
          <th>Status</th>
          <td>{lead ? statusText(lead) : ""}</td>
        </tr>
        <tr>
          <th>Source</th>
          <td>
            {c.source}
            {c.source_detail ? ` (${c.source_detail})` : ""}
          </td>
        </tr>
        <tr>
          <th>Fit</th>
          <td>
            {fit ? (
              <span>
                <strong>{fit.label}</strong>. {fit.evidence}. {fit.why} <span class="muted small">({fit.assessed_on}, {fit.actor})</span>
              </span>
            ) : (
              <span class="muted">no bucket</span>
            )}
            {c.chase_rank && <span> · Chase-first #{c.chase_rank}</span>}
          </td>
        </tr>
        <tr>
          <th>Account owner (Salesforce)</th>
          <td>
            {lead ? ownerText(lead) : ""}
            {c.sf_owner_raw && <div class="muted small">{c.sf_owner_raw}</div>}
          </td>
        </tr>
        {aliases.some((a) => a.alias !== c.name) && (
          <tr>
            <th>Also known as</th>
            <td class="small">{aliases.map((a) => a.alias).filter((a) => a !== c.name).join(" · ")}</td>
          </tr>
        )}
      </table>

      <div class="grid">
        <div>
          <fieldset>
            <legend>Change stage</legend>
            <form method="post" action={post("stage")}>
              <StageSelect value={lead?.stage} /> <input type="date" name="date" value={t} /> <input name="note" placeholder="note" />{" "}
              <input name="reason" placeholder="reason (needed to move backwards or exit)" size={36} /> <button>Save</button>
            </form>
          </fieldset>
          <fieldset>
            <legend>Record a touchpoint</legend>
            <form method="post" action={post("touchpoint")}>
              <select name="kind">
                {["intro_email", "follow_up", "reply_received", "our_reply", "demo_scheduled", "beta_invite", "beta_checkin", "opt_out", "other"].map((k) => (
                  <option value={k}>{k.replace(/_/g, " ")}</option>
                ))}
              </select>{" "}
              <select name="person">
                <option value="">(company)</option>
                {contacts.map((p) => (
                  <option value={p.person_id}>{p.name}</option>
                ))}
              </select>{" "}
              <input type="date" name="date" value={t} /> <input name="note" placeholder="note" /> <button>Add</button>
              <div class="small muted">Touchpoints move the company forward (never back): intro email to Email sent, reply to Replied, and so on.</div>
            </form>
          </fieldset>
          <fieldset>
            <legend>Set fit</legend>
            <form method="post" action={post("fit")}>
              <select name="bucket">
                {buckets.map((b) => (
                  <option value={b.id} selected={fit?.bucket_id === b.id}>
                    {b.label}
                  </option>
                ))}
              </select>{" "}
              <input name="evidence" placeholder="evidence" value={fit?.evidence ?? ""} size={24} /> <input name="why" placeholder="why" value={fit?.why ?? ""} size={48} /> <button>Save</button>
            </form>
          </fieldset>
          <fieldset>
            <legend>Add a note</legend>
            <form method="post" action={post("note")}>
              <textarea name="body" /> <button>Add note</button>
            </form>
          </fieldset>
        </div>
        <div>
          <fieldset>
            <legend>Mark a first sign-in</legend>
            <form method="post" action={post("signin")}>
              <select name="person">
                <option value="">(no one named)</option>
                {contacts.map((p) => (
                  <option value={p.person_id}>{p.name}</option>
                ))}
              </select>{" "}
              <input type="date" name="date" value={t} />{" "}
              <select name="kind">
                <option value="product_login">product login</option>
                <option value="reported_use">reported use</option>
              </select>{" "}
              <input name="note" placeholder="note" /> <button>Record</button>
            </form>
          </fieldset>
          <fieldset>
            <legend>Merge this company into another</legend>
            <form method="post" action={post("merge")}>
              <select name="target">
                {others.map((o) => (
                  <option value={o.id}>{o.name}</option>
                ))}
              </select>{" "}
              <input name="reason" placeholder="reason" size={30} required /> <button>Merge</button>
            </form>
          </fieldset>
          <fieldset>
            <legend>{c.excluded_reason ? "Restore" : "Exclude from the funnel"}</legend>
            <form method="post" action={post(c.excluded_reason ? "restore" : "exclude")}>
              <input name="reason" placeholder="reason" size={40} required /> <button>{c.excluded_reason ? "Restore" : "Exclude"}</button>
            </form>
          </fieldset>
          <fieldset>
            <legend>Salesforce</legend>
            <details>
              <summary>Edit accounts (JSON)</summary>
              <form method="post" action={post("salesforce")}>
                <textarea name="json" style="min-height:160px;font-family:monospace">
                  {accountJson}
                </textarea>
                <div class="small muted">status: matched | no_account | unassigned | not_looked_up. person: a contact's email or name.</div>
                <button>Save</button>
              </form>
            </details>
          </fieldset>
        </div>
      </div>

      <h2>Submitters and contacts</h2>
      <table>
        <tr>
          <th>Name</th>
          <th>Email</th>
          <th>Role</th>
          <th>Contact status</th>
          <th>Do not email</th>
          <th></th>
        </tr>
        {contacts.map((p) => (
          <tr>
            <td>
              {p.name}
              {c.primary_person_id === p.person_id && <span class="muted small"> (primary)</span>}
              {p.note && <div class="small muted">{p.note}</div>}
            </td>
            <td>
              <form method="post" action={`/person/${p.person_id}/email?company=${id}`} class="inline">
                <input name="email" value={p.email ?? ""} size={30} /> <button>Save</button>
              </form>
            </td>
            <td>{p.role}</td>
            <td>
              {stageLabel(p.status)}
              {p.status_note && <span class="muted small"> ({p.status_note})</span>}
            </td>
            <td class="small">
              {p.dne ? (
                <span>
                  {p.dne_on ?? ""} {p.dne}
                </span>
              ) : (
                <form method="post" action={`/person/${p.person_id}/dne?company=${id}`} class="inline">
                  <input name="reason" placeholder="reason" size={16} required /> <button>Do not email</button>
                </form>
              )}
              {p.excluded && <div>Excluded from outreach: {p.excluded}</div>}
            </td>
            <td>
              {c.primary_person_id !== p.person_id && (
                <form method="post" action={post("primary")} class="inline">
                  <input type="hidden" name="person" value={p.person_id} />
                  <button>Make primary</button>
                </form>
              )}
            </td>
          </tr>
        ))}
      </table>
      <h3>Submissions</h3>
      <table>
        <tr>
          <th>Submitted</th>
          <th>Name</th>
          <th>Title</th>
          <th>Relationship</th>
          <th>Form company field</th>
          <th>Disposition</th>
          <th></th>
        </tr>
        {subs.map((s) => (
          <tr>
            <td>{s.submitted_at ?? "not recorded"}</td>
            <td>{s.person_name}</td>
            <td>{s.title ?? ""}</td>
            <td>{s.relationship ?? ""}</td>
            <td>{s.form_company_field ?? ""}</td>
            <td>
              {s.disposition}
              {s.disposition_rule ? ` (${s.disposition_rule})` : ""}
              {s.reason && <div class="small muted">{s.reason}</div>}
              {s.comments && <div class="small">Comments (untrusted): {s.comments}</div>}
            </td>
            <td>
              {s.disposition !== "excluded" && (
                <form method="post" action={`/submission/${s.id}/exclude?company=${id}`} class="inline">
                  <select name="rule">
                    <option value="internal">internal</option>
                    <option value="owned_brand">owned brand</option>
                    <option value="not_product_user">not a product user</option>
                    <option value="accidental">accidental</option>
                    <option value="junk">junk</option>
                  </select>{" "}
                  <input name="reason" placeholder="reason" size={16} required /> <button>Exclude</button>
                </form>
              )}
            </td>
          </tr>
        ))}
      </table>

      <h2>Timeline</h2>
      <table>
        <tr>
          <th>Date</th>
          <th>What</th>
          <th>Who</th>
          <th>Detail</th>
          <th>By</th>
        </tr>
        {timeline(db, id).map((e) => (
          <tr>
            <td>{e.date ?? <span class="muted">undated</span>}</td>
            <td>{e.label}</td>
            <td>{e.who ?? ""}</td>
            <td class="small">{e.detail ?? ""}</td>
            <td class="small muted">{e.actor}</td>
          </tr>
        ))}
      </table>

      <h2>Research</h2>
      {research.map((r) => (
        <fieldset>
          <legend>
            {r.label_raw} <span class="muted small">({r.as_of}, {r.actor})</span>
          </legend>
          <div>
            <Md text={r.body_md} />
          </div>
          {sources.filter((s) => s.research_field_id === r.id).length > 0 && (
            <div class="small muted">
              Sources:{" "}
              {sources
                .filter((s) => s.research_field_id === r.id)
                .map((s) => (
                  <span>
                    <a href={s.url} target="_blank" rel="noreferrer">
                      {s.link_text ?? s.url}
                    </a>{" "}
                  </span>
                ))}
            </div>
          )}
          <details>
            <summary class="small">Edit</summary>
            <form method="post" action={`/research/${r.id}?company=${id}`}>
              <textarea name="body">{r.body_md}</textarea>
              <button>Save</button>
            </form>
          </details>
        </fieldset>
      ))}
      <fieldset>
        <legend>Add research</legend>
        <form method="post" action={post("research")}>
          <select name="field">
            {["what_they_do", "likely_use_case", "known_agent_tooling", "confirmed_use_case", "waiting_on", "outreach", "agent_stack", "other"].map((f) => (
              <option value={f}>{f.replace(/_/g, " ")}</option>
            ))}
          </select>{" "}
          <input name="label" placeholder="label as shown (optional)" />
          <textarea name="body" placeholder="Text. Inline [links](https://...) become sources." />
          <button>Add</button>
        </form>
      </fieldset>

      <div class="grid">
        <div>
          <h2>Salesforce accounts</h2>
          <table>
            <tr>
              <th>Owner</th>
              <th>Account</th>
              <th>Type</th>
              <th>For</th>
              <th>Matched by</th>
            </tr>
            {accounts.map((a) => (
              <tr>
                <td>
                  {a.owner_name}
                  {a.label ? ` (${a.label})` : ""}
                </td>
                <td>{a.account}</td>
                <td>{a.type ?? ""}</td>
                <td>{a.person ?? ""}</td>
                <td class="small">
                  {a.match_method ?? ""}
                  {a.note ? `: ${a.note}` : ""}
                </td>
              </tr>
            ))}
          </table>
          <p class="small muted">Lookup status: {c.sf_lookup_status}</p>
        </div>
        <div>
          <h2>Agent stack (stated)</h2>
          <ul>
            {stacks.map((s) => (
              <li>
                {s.name}
                {s.qualifier ? ` (${s.qualifier})` : ""}
              </li>
            ))}
          </ul>
          <h2>Linked docs</h2>
          <ul>
            {links.map((l) => (
              <li>
                {l.label ?? l.kind}: <code>{l.path_or_url}</code>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <h2>Audit log entries that mention it</h2>
      {audit.length === 0 && <p class="muted">None.</p>}
      {audit.map((m) => (
        <details>
          <summary>
            {m.entry} ({m.lines.length} line{m.lines.length === 1 ? "" : "s"})
          </summary>
          <pre>{m.lines.join("\n")}</pre>
        </details>
      ))}

      <h2>Changes made in the app</h2>
      {changes.length === 0 && <p class="muted">None since the import.</p>}
      <table>
        {changes.map((ch) => (
          <tr>
            <td class="small">{ch.at}</td>
            <td class="small">
              {ch.actor}
              {ch.run_id ? ` (run ${ch.run_id})` : ""}
            </td>
            <td class="small">
              {ch.entity} {ch.action}
            </td>
            <td class="small">
              {ch.before_json ?? ""} → {ch.after_json ?? ""}
              {ch.reason && <div>reason: {ch.reason}</div>}
            </td>
          </tr>
        ))}
      </table>

      {c.import_raw_md && (
        <details>
          <summary>Original section from External Interest.md</summary>
          <pre>{c.import_raw_md}</pre>
        </details>
      )}
    </div>
  );
}
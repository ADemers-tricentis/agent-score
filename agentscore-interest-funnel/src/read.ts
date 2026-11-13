import { all, one, type DB } from "./db.ts";
import { currentStages, daysBetween, median, ownersByCompany, type CompanyOwner } from "./queries.ts";
import { FUNNEL_STAGES, isExit, stageIndex, type Stage } from "./stages.ts";

export type Lead = {
  id: number;
  name: string;
  source: string;
  stage: Stage;
  stage_on: string | null;
  stage_note: string | null;
  bucket_id: string | null;
  bucket: string | null;
  signup: string | null;
  rels: string | null;
  people: number;
  last_out: string | null;
  last_reply: string | null;
  excluded_reason: string | null;
  sf_lookup_status: string;
  chase_rank: number | null;
  owners: CompanyOwner[];
  contacts: string | null;
};

export function leads(db: DB, opts: { includeInactive?: boolean } = {}): Lead[] {
  const rows = all<Omit<Lead, "owners">>(
    db,
    `SELECT c.id, c.name, c.source, se.stage, se.occurred_on AS stage_on, se.note AS stage_note,
            fa.bucket_id, fb.short_label AS bucket, c.excluded_reason, c.sf_lookup_status, c.chase_rank,
            (SELECT min(substr(submitted_at, 1, 10)) FROM submission WHERE company_id = c.id AND disposition IN ('counted', 'stacked')) AS signup,
            (SELECT group_concat(DISTINCT relationship) FROM submission WHERE company_id = c.id AND relationship IS NOT NULL) AS rels,
            (SELECT count(*) FROM contact WHERE company_id = c.id AND role = 'submitter') AS people,
            (SELECT group_concat(p.name, ', ') FROM contact ct JOIN person p ON p.id = ct.person_id WHERE ct.company_id = c.id AND ct.role = 'submitter') AS contacts,
            (SELECT max(occurred_on) FROM touchpoint WHERE company_id = c.id AND kind IN ('intro_email', 'follow_up')) AS last_out,
            (SELECT max(occurred_on) FROM touchpoint WHERE company_id = c.id AND kind = 'reply_received') AS last_reply
     FROM company c
     JOIN stage_event se ON se.id = (SELECT max(id) FROM stage_event WHERE company_id = c.id)
     LEFT JOIN fit_assessment fa ON fa.company_id = c.id AND fa.is_current = 1
     LEFT JOIN fit_bucket fb ON fb.id = fa.bucket_id
     WHERE c.merged_into_id IS NULL ${opts.includeInactive ? "" : "AND c.excluded_reason IS NULL"}
     ORDER BY (SELECT min(submitted_at) FROM submission WHERE company_id = c.id AND disposition IN ('counted', 'stacked')) DESC NULLS LAST, c.id`,
  );
  const owners = ownersByCompany(db);
  return rows.map((r) => ({ ...r, owners: owners.get(r.id) ?? [] }));
}

export function ownerText(l: Pick<Lead, "owners" | "sf_lookup_status">): string {
  if (l.sf_lookup_status === "no_account") return "No account";
  if (l.sf_lookup_status === "unassigned") return "Unassigned";
  if (l.sf_lookup_status === "not_looked_up") return "Not looked up";
  const names = [...new Set(l.owners.map((o) => o.owner_name).filter(Boolean))];
  if (names.length <= 1) return names[0] ?? "";
  return names
    .map((n) => {
      const label = l.owners.find((o) => o.owner_name === n && o.label)?.label;
      return label ? `${n} (${label})` : n;
    })
    .join(", ");
}

export function noReplyDays(l: Lead, today: string): number | null {
  if (l.stage !== "email_sent" && l.stage !== "follow_up_sent") return null;
  const last = l.last_out ?? l.stage_on;
  if (!last) return null;
  if (l.last_reply && l.last_reply >= last) return null;
  return daysBetween(last, today);
}

export type TimelineItem = { date: string | null; kind: string; label: string; detail: string | null; actor: string; who?: string | null };

export function timeline(db: DB, companyId: number): TimelineItem[] {
  const items: TimelineItem[] = [];
  for (const e of all<{ stage: string; occurred_on: string | null; note: string | null; reason: string | null; actor: string; created_at: string }>(
    db,
    "SELECT stage, occurred_on, note, reason, actor, created_at FROM stage_event WHERE company_id = ? ORDER BY id",
    companyId,
  ))
    items.push({
      date: e.occurred_on,
      kind: "stage",
      label: `Stage: ${FUNNEL_STAGES.find((s) => s.id === e.stage)?.label ?? e.stage.replace(/_/g, " ")}`,
      detail: [e.note, e.reason && e.reason !== e.note ? `reason: ${e.reason}` : null].filter(Boolean).join(" · ") || null,
      actor: e.actor,
    });
  for (const t of all<{ kind: string; occurred_on: string | null; note: string | null; source: string; actor: string; who: string | null }>(
    db,
    "SELECT t.kind, t.occurred_on, t.note, t.source, t.actor, p.name AS who FROM touchpoint t LEFT JOIN person p ON p.id = t.person_id WHERE t.company_id = ? ORDER BY t.id",
    companyId,
  ))
    items.push({ date: t.occurred_on, kind: "touchpoint", label: t.kind.replace(/_/g, " "), detail: [t.note, t.source].filter(Boolean).join(" · "), actor: t.actor, who: t.who });
  for (const n of all<{ body_md: string; actor: string; created_at: string }>(db, "SELECT body_md, actor, created_at FROM company_note WHERE company_id = ?", companyId))
    items.push({ date: n.created_at.slice(0, 10), kind: "note", label: "Note", detail: n.body_md, actor: n.actor });
  for (const s of all<{ signed_in_on: string; kind: string; note: string | null; actor: string; who: string | null }>(
    db,
    "SELECT f.signed_in_on, f.kind, f.note, f.actor, p.name AS who FROM first_signin f LEFT JOIN person p ON p.id = f.person_id WHERE f.company_id = ?",
    companyId,
  ))
    items.push({ date: s.signed_in_on, kind: "signin", label: `First sign-in (${s.kind.replace(/_/g, " ")})`, detail: s.note, actor: s.actor, who: s.who });
  return items.sort((a, b) => (a.date ?? "9999").localeCompare(b.date ?? "9999"));
}

export type CohortCompanyRow = {
  cohort: number;
  company_id: number;
  company: string;
  users: string[];
  signup: string | null;
  scheduled: string | null;
  invite: string | null;
  daysSignupToInvite: number | null;
  firstSignin: string | null;
  signinKind: string | null;
  daysInviteToSignin: number | null;
};

export type CohortSummary = {
  number: number;
  invite_sent_on: string | null;
  how_chosen: string | null;
  notes_md: string | null;
  users: number;
  rows: CohortCompanyRow[];
  signedIn: number;
  medianSignupToInvite: number | null;
  rangeSignupToInvite: [number, number] | null;
  medianInviteToSignin: number | null;
};

export function cohorts(db: DB): CohortSummary[] {
  return all<{ id: number; number: number; invite_sent_on: string | null; how_chosen: string | null; notes_md: string | null }>(
    db,
    "SELECT * FROM cohort ORDER BY number",
  ).map((c) => {
    const members = all<{ company_id: number; company: string; person_id: number | null; person: string | null; invite_sent_on: string | null; demo_scheduled_on: string | null }>(
      db,
      `SELECT cm.company_id, co.name AS company, cm.person_id, p.name AS person, cm.invite_sent_on, cm.demo_scheduled_on
       FROM cohort_member cm JOIN company co ON co.id = cm.company_id LEFT JOIN person p ON p.id = cm.person_id
       WHERE cm.cohort_id = ? ORDER BY cm.id`,
      c.id,
    );
    const companyIds = [...new Set(members.map((m) => m.company_id))];
    const rows = companyIds.map((id): CohortCompanyRow => {
      const ms = members.filter((m) => m.company_id === id);
      const pids = ms.map((m) => m.person_id).filter(Boolean);
      const signup = pids.length
        ? one<{ d: string | null }>(
            db,
            `SELECT min(substr(submitted_at, 1, 10)) AS d FROM submission WHERE company_id = ? AND person_id IN (${pids.join(",")}) AND disposition IN ('counted', 'stacked')`,
            id,
          )?.d ?? null
        : null;
      const invite = ms.map((m) => m.invite_sent_on).filter(Boolean).sort()[0] ?? null;
      const scheduled = ms.map((m) => m.demo_scheduled_on).filter(Boolean).sort()[0] ?? null;
      const si = one<{ d: string | null; kind: string | null }>(db, "SELECT signed_in_on AS d, kind FROM first_signin WHERE company_id = ? ORDER BY signed_in_on LIMIT 1", id);
      return {
        cohort: c.number,
        company_id: id,
        company: ms[0].company,
        users: ms.map((m) => m.person ?? "(unknown)"),
        signup,
        scheduled,
        invite,
        daysSignupToInvite: signup && invite ? daysBetween(signup, invite) : null,
        firstSignin: si?.d ?? null,
        signinKind: si?.kind ?? null,
        daysInviteToSignin: si?.d && invite ? daysBetween(invite, si.d) : null,
      };
    });
    const s2i = rows.map((r) => r.daysSignupToInvite).filter((x): x is number => x !== null);
    const i2s = rows.map((r) => r.daysInviteToSignin).filter((x): x is number => x !== null);
    return {
      ...c,
      users: members.length,
      rows,
      signedIn: rows.filter((r) => r.firstSignin).length,
      medianSignupToInvite: median(s2i),
      rangeSignupToInvite: s2i.length ? [Math.min(...s2i), Math.max(...s2i)] : null,
      medianInviteToSignin: median(i2s),
    };
  });
}

export type WeekRow = { week: string; newCompanies: number; cumulative: number; moves: Record<string, number> };

export function weekOf(date: string): string {
  const d = new Date(`${date}T00:00:00Z`);
  const day = (d.getUTCDay() + 6) % 7;
  d.setUTCDate(d.getUTCDate() - day);
  return d.toISOString().slice(0, 10);
}

export function growth(db: DB, today: string): { weeks: WeekRow[]; undatedMoves: number; undatedCompanies: number } {
  const active = new Set(currentStages(db).map((r) => r.company_id));
  const firsts = all<{ company_id: number; d: string | null }>(
    db,
    "SELECT company_id, min(occurred_on) AS d FROM stage_event WHERE stage = 'interested' GROUP BY company_id",
  ).filter((r) => active.has(r.company_id));
  const moves = all<{ stage: string; occurred_on: string | null; company_id: number }>(
    db,
    "SELECT stage, occurred_on, company_id FROM stage_event WHERE stage <> 'interested'",
  ).filter((m) => active.has(m.company_id));
  const dates = [...firsts.map((f) => f.d), ...moves.map((m) => m.occurred_on)].filter(Boolean) as string[];
  if (!dates.length) return { weeks: [], undatedMoves: 0, undatedCompanies: 0 };
  const start = weekOf(dates.sort()[0]);
  const weeks: WeekRow[] = [];
  for (let w = start; w <= weekOf(today); w = addDays(w, 7)) weeks.push({ week: w, newCompanies: 0, cumulative: 0, moves: {} });
  const idx = new Map(weeks.map((w, i) => [w.week, i]));
  for (const f of firsts) if (f.d) weeks[idx.get(weekOf(f.d))!].newCompanies++;
  for (const m of moves) {
    if (!m.occurred_on) continue;
    const w = weeks[idx.get(weekOf(m.occurred_on))!];
    if (w) w.moves[m.stage] = (w.moves[m.stage] ?? 0) + 1;
  }
  let run = 0;
  for (const w of weeks) w.cumulative = run += w.newCompanies;
  return {
    weeks,
    undatedMoves: moves.filter((m) => !m.occurred_on).length,
    undatedCompanies: firsts.filter((f) => !f.d).length,
  };
}

function addDays(date: string, n: number) {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

export function companyByIdOrName(db: DB, key: string): { id: number; name: string } | undefined {
  if (/^\d+$/.test(key)) return one(db, "SELECT id, name FROM company WHERE id = ?", Number(key));
  return (
    one(db, "SELECT id, name FROM company WHERE lower(name) = lower(?)", key) ??
    one(db, "SELECT c.id, c.name FROM company c JOIN company_alias a ON a.company_id = c.id WHERE lower(a.alias) = lower(?) LIMIT 1", key)
  );
}

export function stageRank(stage: string) {
  return isExit(stage) ? 100 : stageIndex(stage);
}

import { all, one, type DB } from "./db.ts";
import { FUNNEL_STAGES, isExit, stageIndex, type Stage } from "./stages.ts";

/** Latest stage per company. Merged and excluded companies are left out. */
export const CURRENT_STAGE_SQL = `
  SELECT c.id AS company_id, c.name, se.stage, se.occurred_on, se.note
  FROM company c
  JOIN stage_event se ON se.id = (SELECT max(id) FROM stage_event WHERE company_id = c.id)
  WHERE c.merged_into_id IS NULL AND c.excluded_reason IS NULL`;

export type CurrentRow = { company_id: number; name: string; stage: Stage; occurred_on: string | null; note: string | null };

export function currentStages(db: DB): CurrentRow[] {
  return all<CurrentRow>(db, CURRENT_STAGE_SQL);
}

export type FunnelCounts = {
  stages: { id: string; label: string; current: number; cumulative: number }[];
  total: number;
  exited: { not_a_fit: number; do_not_email: number };
};

export function funnelCounts(db: DB): FunnelCounts {
  const rows = currentStages(db);
  const inFunnel = rows.filter((r) => !isExit(r.stage));
  const current = FUNNEL_STAGES.map((s) => inFunnel.filter((r) => r.stage === s.id).length);
  const stages = FUNNEL_STAGES.map((s, i) => ({
    id: s.id,
    label: s.label,
    current: current[i],
    cumulative: current.slice(i).reduce((a, b) => a + b, 0),
  }));
  return {
    stages,
    total: inFunnel.length,
    exited: {
      not_a_fit: rows.filter((r) => r.stage === "not_a_fit").length,
      do_not_email: rows.filter((r) => r.stage === "do_not_email").length,
    },
  };
}

export function companiesAtStage(db: DB, stage: string, mode: "current" | "cumulative" = "current"): CurrentRow[] {
  const rows = currentStages(db);
  if (mode === "current") return rows.filter((r) => r.stage === stage);
  const idx = stageIndex(stage);
  return rows.filter((r) => !isExit(r.stage) && stageIndex(r.stage) >= idx);
}

export type CompanyOwner = { company_id: number; owner_name: string | null; account: string; type: string | null; label: string | null; placeholder: number };

export function ownersByCompany(db: DB): Map<number, CompanyOwner[]> {
  const rows = all<CompanyOwner>(
    db,
    `SELECT DISTINCT csa.company_id, a.owner_name, a.name AS account, a.type, csa.label, a.owner_is_placeholder AS placeholder
     FROM company_sf_account csa JOIN sf_account a ON a.id = csa.sf_account_id`,
  );
  const map = new Map<number, CompanyOwner[]>();
  for (const r of rows) {
    const list = map.get(r.company_id) ?? [];
    if (!list.some((x) => x.account === r.account)) list.push(r);
    map.set(r.company_id, list);
  }
  return map;
}

export function ownerSummary(db: DB, companyId: number): string {
  const c = one<{ sf_lookup_status: string }>(db, "SELECT sf_lookup_status FROM company WHERE id = ?", companyId);
  if (!c) return "";
  if (c.sf_lookup_status === "no_account") return "No account";
  if (c.sf_lookup_status === "unassigned") return "Unassigned";
  if (c.sf_lookup_status === "not_looked_up") return "Not looked up";
  const owners = ownersByCompany(db).get(companyId) ?? [];
  const names = [...new Set(owners.map((o) => o.owner_name).filter(Boolean))] as string[];
  return names.join(", ");
}

export function median(xs: number[]): number | null {
  if (!xs.length) return null;
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

export function daysBetween(a: string, b: string): number {
  return Math.round((Date.parse(b) - Date.parse(a)) / 86_400_000);
}

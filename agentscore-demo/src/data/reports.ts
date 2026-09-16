import type { UsageReport, UsageTenantRow, UsageAgentRow } from "../types";
import { PROJECTS, TENANTS, LLM_USAGE_LOG } from "./mock";

// ── Formatters (ported from production's shared/reports/format.ts) ──────────

export function formatReportCost(usd: string | null): string {
  if (usd == null) return "—";
  const n = parseFloat(usd);
  if (isNaN(n)) return "—";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);
}

export function formatUnitCost(usd: string | null): string {
  if (usd == null) return "—";
  const n = parseFloat(usd);
  if (isNaN(n)) return "—";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 4, maximumFractionDigits: 4 }).format(n);
}

export function formatReportCount(n: number): string {
  return n.toLocaleString("en-US");
}

export function formatAverage(n: number | null): string {
  if (n == null) return "—";
  return n.toFixed(1);
}

// ── Time range presets ───────────────────────────────────────────────────────

export const RANGE_PRESETS = ["30m", "1h", "6h", "1d", "3d", "7d", "14d", "30d", "90d"] as const;
export type RangePreset = (typeof RANGE_PRESETS)[number];

export const RANGE_LABELS: Record<RangePreset, string> = {
  "30m": "Past 30 min",
  "1h": "Past 1 hour",
  "6h": "Past 6 hours",
  "1d": "Past 1 day",
  "3d": "Past 3 days",
  "7d": "Past 7 days",
  "14d": "Past 14 days",
  "30d": "Past 30 days",
  "90d": "Past 90 days",
};

const RANGE_DAYS: Record<RangePreset, number> = {
  "30m": 30 / 1440,
  "1h": 1 / 24,
  "6h": 6 / 24,
  "1d": 1,
  "3d": 3,
  "7d": 7,
  "14d": 14,
  "30d": 30,
  "90d": 90,
};

export const DEFAULT_RANGE: RangePreset = "30d";

function categoryForTask(task: string): "scoring" | "profileFit" | "agentCard" | "other" {
  if (task === "Score Judge") return "scoring";
  if (task === "Profile Fit Matcher") return "profileFit";
  if (task === "Agent Card Writer") return "agentCard";
  return "other";
}

// A synthetic soft-deleted tenant, present only in reporting history - exercises the
// `Deleted` chip without needing a real (still-active) tenant record.
const DELETED_TENANT = { id: "tenant-former-pilot", name: "Former Pilot Co" };

interface TenantAccum {
  tenantId: string;
  tenantName: string;
  isDeleted: boolean;
  activeAgents: number;
  traces: number;
  evalResults: number;
  profileFits: number;
  agentCards: number;
}

function baselineTenantAccums(): TenantAccum[] {
  const accums: TenantAccum[] = TENANTS.map((t) => {
    const tenantProjects = PROJECTS.filter((p) => p.tenantId === t.id);
    const traces = tenantProjects.flatMap((p) => p.runs.flatMap((r) => r.sessions)).length;
    const agentCards = tenantProjects.filter((p) => p.events?.some((e) => e.kind === "profile_adopted")).length;
    return {
      tenantId: t.id,
      tenantName: t.name,
      isDeleted: false,
      activeAgents: tenantProjects.length,
      traces,
      evalResults: Math.round(traces * 6.5),
      profileFits: tenantProjects.filter((p) => p.adoptedProfileId).length,
      agentCards,
    };
  });

  accums.push({
    tenantId: DELETED_TENANT.id,
    tenantName: DELETED_TENANT.name,
    isDeleted: true,
    activeAgents: 0,
    traces: 340,
    evalResults: 2200,
    profileFits: 0,
    agentCards: 0,
  });

  return accums;
}

function allocateCosts(traces: number, totalTraces: number, scale: number) {
  const costTotals = { scoring: 0, profileFit: 0, agentCard: 0, other: 0 };
  for (const entry of LLM_USAGE_LOG) {
    costTotals[categoryForTask(entry.task)] += entry.costUsd;
  }
  const share = totalTraces > 0 ? traces / totalTraces : 0;
  const scoring = costTotals.scoring * share * scale;
  const profileFit = costTotals.profileFit * share * scale;
  const agentCard = costTotals.agentCard * share * scale;
  const other = costTotals.other * share * scale;
  return {
    costScoringUsd: scoring.toFixed(2),
    costProfileFitUsd: profileFit.toFixed(2),
    costAgentCardUsd: agentCard.toFixed(2),
    costOtherUsd: other.toFixed(2),
    costUsd: (scoring + profileFit + agentCard + other).toFixed(2),
  };
}

export function usageReport(range: string): UsageReport {
  const preset = (RANGE_PRESETS as readonly string[]).includes(range) ? (range as RangePreset) : DEFAULT_RANGE;
  const days = RANGE_DAYS[preset];
  const scale = days / 30;

  const now = new Date();
  const windowTo = now.toISOString();
  const windowFrom = new Date(now.getTime() - days * 86400000).toISOString();

  const tenantAccums = baselineTenantAccums();
  const totalTraces = tenantAccums.reduce((sum, t) => sum + t.traces, 0);

  const tenants: UsageTenantRow[] = tenantAccums.map((t) => {
    const traces = Math.round(t.traces * scale);
    const evalResults = Math.round(t.evalResults * scale);
    const profileFits = Math.round(t.profileFits * scale);
    const costs = allocateCosts(t.traces, totalTraces, scale);
    return {
      tenantId: t.tenantId,
      tenantName: t.tenantName,
      isDeleted: t.isDeleted,
      activeAgents: t.activeAgents,
      traces,
      avgTracesPerActiveAgent: t.activeAgents > 0 ? traces / t.activeAgents : null,
      evalResults,
      profileFits,
      agentCards: t.agentCards,
      ...costs,
      avgCostPerEvalResult: evalResults > 0 ? (parseFloat(costs.costScoringUsd) / evalResults).toFixed(4) : null,
      avgCostPerProfileFit: profileFits > 0 ? (parseFloat(costs.costProfileFitUsd) / profileFits).toFixed(4) : null,
      avgCostPerAgentCard: t.agentCards > 0 ? (parseFloat(costs.costAgentCardUsd) / t.agentCards).toFixed(4) : null,
    };
  });

  const agents: UsageAgentRow[] = PROJECTS.map((p) => {
    const tenant = TENANTS.find((t) => t.id === p.tenantId);
    const rawTraces = p.runs.flatMap((r) => r.sessions).length;
    const traces = Math.round(rawTraces * scale);
    const evalResults = Math.round(rawTraces * 6.5 * scale);
    const profileFits = p.adoptedProfileId ? Math.round(scale) : 0;
    const agentCards = p.events?.some((e) => e.kind === "profile_adopted") ? 1 : 0;
    const costs = allocateCosts(rawTraces, totalTraces, scale);
    return {
      agentId: p.id,
      agentName: p.name,
      tenantId: p.tenantId ?? "",
      tenantName: tenant?.name ?? p.tenantId ?? "",
      traces,
      evalResults,
      profileFits,
      agentCards,
      ...costs,
      avgCostPerEvalResult: evalResults > 0 ? (parseFloat(costs.costScoringUsd) / evalResults).toFixed(4) : null,
      avgCostPerProfileFit: profileFits > 0 ? (parseFloat(costs.costProfileFitUsd) / profileFits).toFixed(4) : null,
      avgCostPerAgentCard: agentCards > 0 ? (parseFloat(costs.costAgentCardUsd) / agentCards).toFixed(4) : null,
    };
  });

  return { windowFrom, windowTo, tenants, agents };
}

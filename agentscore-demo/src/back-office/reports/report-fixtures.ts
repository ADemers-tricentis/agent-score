// Fake data for the Reports section (UsageReportTab / TenantUsageDetailPage) —
// no backend. Shapes mirror the real `UsageReport`/`UsageReportTenantRow`/
// `UsageReportAgentRow` wire types closely enough for the cloned UI to render
// unmodified.
import { useFakeQuery } from "@/back-office/agents/fake-query";

export interface UsageReportTenantRow {
  tenantId: string;
  tenantName: string;
  isDeleted: boolean;
  activeAgents: number;
  traces: number;
  avgTracesPerActiveAgent: number | null;
  evalResults: number;
  profileFits: number;
  agentCards: number;
  costUsd: string;
  costScoringUsd: string;
  costProfileFitUsd: string;
  costAgentCardUsd: string;
  costOtherUsd: string;
  avgCostPerEvalResult: string | null;
  avgCostPerProfileFit: string | null;
  avgCostPerAgentCard: string | null;
}

export interface UsageReportAgentRow {
  agentId: string;
  agentName: string;
  tenantId: string;
  traces: number;
  evalResults: number;
  profileFits: number;
  agentCards: number;
  costUsd: string;
  costScoringUsd: string;
  costProfileFitUsd: string;
  costAgentCardUsd: string;
  costOtherUsd: string;
  avgCostPerEvalResult: string | null;
  avgCostPerProfileFit: string | null;
  avgCostPerAgentCard: string | null;
}

export interface UsageReport {
  tenants: UsageReportTenantRow[];
  agents: UsageReportAgentRow[];
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function usd(n: number): string {
  return n.toFixed(2);
}

function agentRow(agentId: string, agentName: string, tenantId: string, traces: number, evalResults: number, profileFits: number, agentCards: number): UsageReportAgentRow {
  const costScoringUsd = round2(evalResults * 0.014);
  const costProfileFitUsd = round2(profileFits * 0.06);
  const costAgentCardUsd = round2(agentCards * 0.09);
  const costOtherUsd = round2(traces * 0.0008);
  const costUsd = round2(costScoringUsd + costProfileFitUsd + costAgentCardUsd + costOtherUsd);
  return {
    agentId, agentName, tenantId, traces, evalResults, profileFits, agentCards,
    costUsd: usd(costUsd), costScoringUsd: usd(costScoringUsd), costProfileFitUsd: usd(costProfileFitUsd), costAgentCardUsd: usd(costAgentCardUsd), costOtherUsd: usd(costOtherUsd),
    avgCostPerEvalResult: evalResults > 0 ? usd(costScoringUsd / evalResults) : null,
    avgCostPerProfileFit: profileFits > 0 ? usd(costProfileFitUsd / profileFits) : null,
    avgCostPerAgentCard: agentCards > 0 ? usd(costAgentCardUsd / agentCards) : null,
  };
}

const AGENTS: UsageReportAgentRow[] = [
  agentRow("agent-1", "ATA Regression Suite", "tenant-tais", 226, 1130, 22, 4),
  agentRow("agent-2", "jira epic poller", "tenant-tar", 97, 485, 9, 2),
  agentRow("agent-3", "invoice-reconciler", "tenant-acme", 412, 2060, 41, 6),
  agentRow("agent-6", "expense-classifier", "tenant-acme", 158, 790, 15, 3),
  agentRow("agent-4", "support-triage-bot", "tenant-northwind", 586, 2930, 58, 9),
  agentRow("agent-7", "returns-approval-agent", "tenant-northwind", 74, 370, 7, 2),
  agentRow("agent-5", "code-review-assistant", "tenant-globex", 31, 155, 3, 1),
  agentRow("agent-8", "legacy-triage-bot", "tenant-globex", 12, 60, 1, 0),
];

function tenantRow(tenantId: string, tenantName: string, isDeleted = false): UsageReportTenantRow {
  const rows = AGENTS.filter((a) => a.tenantId === tenantId);
  const sum = (fn: (a: UsageReportAgentRow) => string) => round2(rows.reduce((acc, a) => acc + Number(fn(a)), 0));
  const traces = rows.reduce((acc, a) => acc + a.traces, 0);
  const evalResults = rows.reduce((acc, a) => acc + a.evalResults, 0);
  const profileFits = rows.reduce((acc, a) => acc + a.profileFits, 0);
  const agentCards = rows.reduce((acc, a) => acc + a.agentCards, 0);
  const costUsd = sum((a) => a.costUsd);
  const costScoringUsd = sum((a) => a.costScoringUsd);
  const costProfileFitUsd = sum((a) => a.costProfileFitUsd);
  const costAgentCardUsd = sum((a) => a.costAgentCardUsd);
  const costOtherUsd = sum((a) => a.costOtherUsd);
  return {
    tenantId, tenantName, isDeleted,
    activeAgents: rows.length,
    traces, avgTracesPerActiveAgent: rows.length > 0 ? round2(traces / rows.length) : null,
    evalResults, profileFits, agentCards,
    costUsd: usd(costUsd), costScoringUsd: usd(costScoringUsd), costProfileFitUsd: usd(costProfileFitUsd), costAgentCardUsd: usd(costAgentCardUsd), costOtherUsd: usd(costOtherUsd),
    avgCostPerEvalResult: evalResults > 0 ? usd(costScoringUsd / evalResults) : null,
    avgCostPerProfileFit: profileFits > 0 ? usd(costProfileFitUsd / profileFits) : null,
    avgCostPerAgentCard: agentCards > 0 ? usd(costAgentCardUsd / agentCards) : null,
  };
}

const TENANTS: UsageReportTenantRow[] = [
  tenantRow("tenant-tais", "TAIS (Testing AI team)"),
  tenantRow("tenant-tar", "tricentisairesearch"),
  tenantRow("tenant-acme", "Acme Financial"),
  tenantRow("tenant-northwind", "Northwind Retail"),
  tenantRow("tenant-globex", "Globex Engineering"),
];

export function getUsageReport(): UsageReport {
  return { tenants: TENANTS, agents: AGENTS };
}

export function useUsageReport(fromIso: string, toIso: string, refreshNonce: number) {
  return useFakeQuery<UsageReport>({
    queryKey: ["reports", "usage", fromIso, toIso, refreshNonce],
    queryFn: () => getUsageReport(),
  });
}

export async function downloadUsageReport(_fromIso: string, _toIso: string, _tenantId?: string): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 400));
}

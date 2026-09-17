/** Fake labeling-queue data, standing in for the real `scoring-api` endpoints
 *  this page used to call. Canonical agent roster shared with sibling agent
 *  tabs being faked in parallel — keep ids/names in sync if you touch this. */

export type LabelDecisionIn = {
  decision: "confirm" | "override";
  traceId: string;
  verdict?: "correct" | "incorrect" | null;
  expectedOutput?: string | null;
  expectedOutcome?: string | null;
  expectedTools?: string[] | null;
  note?: string | null;
};

export type LabelingProposal = {
  traceId: string;
  input: Record<string, unknown>;
  output?: string | null;
  proposedVerdict?: string | null;
  proposedReason?: string | null;
  timestamp?: string | null;
};

export interface Readiness {
  captured: number;
  threshold: number;
  ready: boolean;
  lastReadinessCheckAt?: string | null;
  nextRecheckAt?: string | null;
}

export interface LabelingFixture {
  readiness: Readiness;
  queue: LabelingProposal[];
  goldensCount: number;
}

interface Scenario {
  request: string;
  output: string;
  proposedVerdict?: string;
  proposedReason?: string;
}

const SCENARIOS: Record<string, Scenario[]> = {
  "agent-1": [
    { request: "Run full regression suite against the payment workflow", output: "Regression complete: 12 passed, 0 failed, 1 skipped.", proposedVerdict: "correct", proposedReason: "All assertions matched the golden baseline." },
    { request: "Check the zero-balance account edge case", output: "Edge case handled: transaction correctly rejected with INSUFFICIENT_FUNDS.", proposedVerdict: "correct" },
    { request: "Validate the happy-path standard transaction", output: "Standard transaction completed in 1.2s, receipt generated.", proposedVerdict: "correct" },
    { request: "Retry the flaky test_currency_rounding case", output: "test_currency_rounding passed on retry 2/3.", proposedVerdict: "incorrect", proposedReason: "Passed only after retries — underlying flakiness not actually fixed." },
    { request: "Compare v2.4.1 vs v2.4.2 latency baselines", output: "P95 latency regressed from 32.1s to 48.2s between builds.", proposedVerdict: "correct" },
    { request: "Generate a test case for the refund-after-chargeback flow", output: "Generated test_refund_after_chargeback with 4 assertions.", proposedVerdict: "correct" },
    { request: "Diagnose why test_partial_refund is failing", output: "Root cause: rounding mode changed from HALF_UP to HALF_EVEN in v2.4.2.", proposedVerdict: "correct" },
    { request: "Confirm suite coverage for the new subscription-pause feature", output: "No coverage found — 0 tests reference subscription-pause.", proposedVerdict: "incorrect", proposedReason: "Should have flagged this as a coverage gap requiring new test generation, not just reported the gap." },
  ],
  "agent-2": [
    { request: "Poll for epics updated in the last hour in project ATA", output: "Found 3 updated epics: ATA-412, ATA-415, ATA-421.", proposedVerdict: "correct" },
    { request: "Summarize the status of epic ATA-412", output: "ATA-412 is 60% complete, 3 of 5 stories done, no blockers reported.", proposedVerdict: "correct" },
    { request: "Flag epics with no activity in 14 days", output: "ATA-390 has had no activity since Aug 28.", proposedVerdict: "correct" },
    { request: "Post a summary comment on ATA-421", output: "Comment posted: 'Epic now includes 2 new stories from sprint planning.'", proposedVerdict: "incorrect", proposedReason: "Comment described stories added 3 sprints ago, not the current sprint." },
    { request: "Check for duplicate epics across ATA and ATC projects", output: "No duplicates found.", proposedVerdict: "correct" },
    { request: "Escalate epics past their due date", output: "Escalated ATA-388 (3 days overdue) to epic owner.", proposedVerdict: "correct" },
  ],
  "agent-3": [
    { request: "Reconcile invoice INV-88213 against the payment ledger", output: "Matched: INV-88213 paid in full on 2026-09-10.", proposedVerdict: "correct" },
    { request: "Flag invoices with amount mismatches over $50", output: "INV-88250 has a $120 mismatch (invoiced $4,200, paid $4,080).", proposedVerdict: "correct" },
    { request: "Reconcile a partially-paid invoice with two installments", output: "INV-88190 marked fully reconciled.", proposedVerdict: "incorrect", proposedReason: "Only the first installment was matched; the second $2,000 installment is still outstanding." },
    { request: "Match a foreign-currency invoice against the USD ledger", output: "Matched INV-88301 (EUR 3,000) to $3,240 using the 2026-09-08 exchange rate.", proposedVerdict: "correct" },
    { request: "Reconcile invoice with a bank fee deducted", output: "INV-88266 matched net of a $15 wire fee.", proposedVerdict: "correct" },
  ],
  "agent-4": [
    { request: "Triage ticket #4021: 'app crashes on login'", output: "Categorized as P1/Auth, routed to the identity team.", proposedVerdict: "correct" },
    { request: "Triage ticket #4022: 'export button is grey'", output: "Categorized as P3/UI, routed to frontend backlog.", proposedVerdict: "correct" },
    { request: "Triage ticket #4023: 'billed twice this month'", output: "Categorized as P3/Billing, routed to frontend backlog.", proposedVerdict: "incorrect", proposedReason: "Duplicate billing charges should be P1/Billing, not P3 — this is a refund-urgent issue." },
    { request: "Triage ticket #4024: 'feature request: dark mode'", output: "Categorized as P4/Feature Request, added to product backlog.", proposedVerdict: "correct" },
    { request: "Detect duplicate tickets for the same reported crash", output: "Linked ticket #4025 as a duplicate of #4021.", proposedVerdict: "correct" },
  ],
};

const DEFAULT_SCENARIOS: Scenario[] = SCENARIOS["agent-1"];

function buildQueue(agentId: string, count: number): LabelingProposal[] {
  const scenarios = SCENARIOS[agentId] ?? DEFAULT_SCENARIOS;
  const items: LabelingProposal[] = [];
  for (let i = 0; i < count; i++) {
    const s = scenarios[i % scenarios.length];
    const suffix = i >= scenarios.length ? ` (run ${Math.floor(i / scenarios.length) + 1})` : "";
    items.push({
      traceId: `${agentId}-trace-${String(i + 1).padStart(3, "0")}`,
      input: { request: s.request + suffix },
      output: s.output,
      proposedVerdict: s.proposedVerdict,
      proposedReason: s.proposedReason,
      timestamp: new Date(Date.now() - i * 45 * 60 * 1000).toISOString(),
    });
  }
  return items;
}

const FIXTURES: Record<string, LabelingFixture> = {
  "agent-1": { readiness: { captured: 142, threshold: 20, ready: true }, queue: buildQueue("agent-1", 18), goldensCount: 34 },
  "agent-2": { readiness: { captured: 58, threshold: 20, ready: true }, queue: buildQueue("agent-2", 6), goldensCount: 11 },
  "agent-3": { readiness: { captured: 47, threshold: 20, ready: true }, queue: buildQueue("agent-3", 5), goldensCount: 9 },
  "agent-4": { readiness: { captured: 33, threshold: 20, ready: true }, queue: buildQueue("agent-4", 5), goldensCount: 6 },
  "agent-5": { readiness: { captured: 6, threshold: 20, ready: false, nextRecheckAt: new Date(Date.now() + 3600_000).toISOString() }, queue: [], goldensCount: 0 },
};

export function labelingFixtureFor(agentId: string): LabelingFixture {
  return FIXTURES[agentId] ?? { readiness: { captured: 25, threshold: 20, ready: true }, queue: buildQueue(agentId, 5), goldensCount: 4 };
}

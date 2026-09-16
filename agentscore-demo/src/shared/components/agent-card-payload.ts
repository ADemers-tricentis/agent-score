/** The Agent Card `payload` contract and the formatters that read it.
 *
 * `payload` is raw JSONB written by the backend's `card_engine`: opaque
 * (`object | null`) in the generated OpenAPI contract, snake_case, and
 * **identical** on the back-office `AgentCardOut` and the customer
 * `CustomerAgentCard` — the wrapper fields around it are not (one is
 * camelCase and carries six fields the other drops), which is why the payload
 * is the reuse seam. The types below mirror `card_engine.generate_agent_card`
 * verbatim. The payload is server-authored, never user input, so
 * `asCardPayload` is a type-safety boundary rather than a validator — it
 * checks only the two keys the view dereferences immediately, because those
 * are the ones whose absence would crash the render.
 *
 * Separate from `agent-card-view.tsx` because a module that exports React
 * components cannot also export plain functions (`react-refresh/only-export
 * -components`, lint-enforced) — and the back-office wrapper needs
 * `asCardPayload` plus the window/confidence formatters for its provenance
 * footer.
 */

export const MONO = "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";

export interface CardObservedField {
  key: string;
  presence: "always" | "sometimes";
}

export interface CardObservedToolSchema {
  tool_name: string;
  observed_from_n_calls: number;
  input_fields: CardObservedField[];
  output_fields: CardObservedField[];
}

export interface CardObservedTool {
  name: string;
  call_count: number;
  success_rate: number;
  origin: string;
}

export interface CardBehavioralSequence {
  pattern: string;
  occurrences: number;
  total: number;
}

export interface CardPercentiles {
  p50: number | null;
  p90: number | null;
}

export interface CardOperationalStats {
  latency_ms: CardPercentiles;
  tokens: CardPercentiles;
  cost_usd: CardPercentiles;
}

export interface CardExampleTrace {
  trace_id: string | null;
  snapshot: Record<string, unknown>;
}

export interface CardFitContext {
  chosen_profile: string | null;
  confidence: number | null;
  evaluated_under: string | null;
}

export interface CardObserved {
  window: { start: string; end: string; trace_count: number };
  tools: CardObservedTool[];
  tool_schemas: CardObservedToolSchema[];
  behavioral_sequences: CardBehavioralSequence[];
  operational_stats: CardOperationalStats;
  example_trace: CardExampleTrace | null;
  fit_context: CardFitContext;
}

export interface CardInferred {
  purpose: string;
  tool_descriptions: Record<string, string>;
  behavioral_patterns: string[];
  success_criteria: string[];
  failure_modes: string[];
}

export interface CardPayload {
  agent_name: string;
  observed: CardObserved;
  inferred: CardInferred;
}

function isObject(value: unknown): boolean {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** `payload` is non-null iff the generation status is `ok` (app-level
 *  invariant, `agent-card` spec §4.2 validation table).
 *
 * The two branch keys are checked, not just the outer object: the view
 * destructures `observed` and `inferred` and dereferences both immediately, so
 * a row that satisfied only the outer test would throw during render — and
 * neither app mounts an error boundary, so that takes the whole page down
 * instead of the one section. Returning null routes it to the
 * payload-unreadable alert, which exists for exactly this. The deeper fields
 * stay a structural cast: the payload is server-authored, and validating a
 * whole tree written by `card_engine` would be schema duplication. */
export function asCardPayload(payload: unknown): CardPayload | null {
  if (!isObject(payload)) return null;
  const candidate = payload as Partial<CardPayload>;
  if (!isObject(candidate.observed) || !isObject(candidate.inferred)) return null;
  return payload as CardPayload;
}

export function formatPercent(value: number): string {
  return `${Math.round(value * 100)}%`;
}

export function formatDate(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString();
}

export function formatCompactNumber(value: number): string {
  return value >= 1000 ? `${(value / 1000).toFixed(1)}k` : String(Math.round(value));
}

export function formatCost(value: number): string {
  return `$${value.toFixed(3)}`;
}

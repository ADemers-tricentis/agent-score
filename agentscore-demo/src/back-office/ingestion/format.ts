/** Ingestion display formatters + label maps.
 *
 * Pure functions and constant maps shared by the ingestion tabs. Kept in one
 * module so the label/threshold/denominator vocabulary can't drift between the
 * tabs and its unit test.
 */

import type {
  AlertRule,
  ForwardStatus,
  IngestionEventSeverity,
  IngestionEventType,
} from "@/back-office/ingestion/api";

/** Compact integer with thousands separators (e.g. 12,405). */
export function fmtCount(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  return value.toLocaleString();
}

/** 0–1 ratio → one-decimal percent for finer metrics (e.g. "4.3%"). */
export function fmtPercent1(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  return `${(value * 100).toFixed(1)}%`;
}

/** TPS with one decimal below 100, whole above (display metric, 1-min avg). */
export function fmtTps(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  return value >= 100 ? Math.round(value).toLocaleString() : value.toFixed(1);
}

/** Byte count → human size (B / KB / MB). */
export function fmtBytes(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  if (value < 1024) return `${Math.round(value)} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}

/** Relative "time ago" for last-seen columns — now shared with the customer
 *  app, so the implementation lives in `shared/format/`. Re-exported here
 *  because the ingestion tabs and their tests import it from this module. */
export { fmtRelative } from "@/shared/format/relative";

/** Absolute short timestamp for detail panels + activity rows. */
export function fmtTimestamp(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Whole-unit age (s/m/h/d), no sub-second precision — for a watermark/cursor
 *  age (a magnitude, not an elapsed-since-timestamp), so `formatDuration`'s
 *  trace-latency precision ("7.00s" / "500ms") would be false precision here. */
export function fmtAge(seconds: number | null | undefined): string {
  if (seconds === null || seconds === undefined || Number.isNaN(seconds)) {
    return "—";
  }
  const sec = Math.round(seconds);
  if (sec < 60) return `${sec}s`;
  const min = Math.round(sec / 60);
  if (min < 60) return `${min}m`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr}h`;
  const day = Math.round(hr / 24);
  return `${day}d`;
}

// ---------------------------------------------------------------------------
// Alert rules (spec §6.6 / FR-G4)
// ---------------------------------------------------------------------------

export const ALERT_RULE_LABELS: Record<AlertRule, string> = {
  error_rate: "Error-rate spike",
  write_failure: "Write failures",
  limit_breach: "Rate-limit / quota breach",
  quarantine_spike: "Quarantine spike",
  promotion_stall: "Promotion stall",
  stream_delivery_loss: "Stream delivery loss",
  stream_capture_stall: "Stream capture stall",
  stream_receipt_disconnect: "Stream receipt disconnect",
  memory_pressure: "Memory pressure",
  restart_churn: "Restart churn",
  unclean_shutdown: "Unclean shutdown",
};

/** The denominator each rule's `min_volume` floor applies to (spec §4.3). */
export const ALERT_RULE_DENOMINATOR: Record<AlertRule, string> = {
  error_rate: "traces_received",
  limit_breach: "traces_received",
  write_failure: "written + failed",
  quarantine_spike: "agent_runs_total",
  promotion_stall: "agent_runs_total",
  stream_delivery_loss: "stream_spans_captured",
  stream_capture_stall: "stream_capture_cycles",
  stream_receipt_disconnect: "stream_spans_forwarded",
  memory_pressure: "memory_samples",
  restart_churn: "service_boots",
  unclean_shutdown: "unclean_shutdowns",
};

/** Every rule's threshold is a ratio in 0–1 EXCEPT `restart_churn`, whose
 *  threshold is a count of process boots (e.g. 3) — rendering it through the
 *  same percent formatter as the rest would show "300%". This is the single
 *  place that decides which formatter a rule's threshold/observed-value gets;
 *  a new rule that forgets an entry here is a type error, not a silent 0–1
 *  assumption. */
export const ALERT_RULE_VALUE_KIND: Record<AlertRule, "ratio" | "count"> = {
  error_rate: "ratio",
  limit_breach: "ratio",
  write_failure: "ratio",
  quarantine_spike: "ratio",
  promotion_stall: "ratio",
  stream_delivery_loss: "ratio",
  stream_capture_stall: "ratio",
  stream_receipt_disconnect: "ratio",
  memory_pressure: "ratio",
  restart_churn: "count",
  unclean_shutdown: "count",
};

/** A rule's threshold or observed value, formatted for its own domain — a
 *  0–1 ratio as a percent, a boot count as a plain count. */
export function fmtAlertRuleValue(
  rule: AlertRule,
  value: number | null | undefined,
): string {
  return ALERT_RULE_VALUE_KIND[rule] === "count"
    ? fmtCount(value)
    : fmtPercent1(value);
}

export const ALERT_RULE_HELP: Partial<Record<AlertRule, string>> = {
  quarantine_spike:
    "Counts identity-failure quarantines only, not operator-gated withholds.",
  promotion_stall:
    "Fires when the sweeper is attempting promotions but writing almost none. " +
    "Every other rule here is a ratio of failures, and a stalled promotion " +
    "produces none — it is deferred, not failed — so this is the only rule " +
    "that sees a sweeper spinning with a growing buffer.",
  stream_delivery_loss:
    "Fires when the share of captured spans the receipt route confirmed falls " +
    "below the threshold — the rule that sees a stream capturing normally and " +
    "delivering almost nothing.",
  stream_capture_stall:
    "Fires when the loop is issuing queries to Better Stack and capturing no " +
    "spans at all. The cycle counter is what separates a stalled loop from a " +
    "stopped one, so switching the stream off does not raise it.",
  stream_receipt_disconnect:
    "Fires when the stream confirmed spans but the receipt route recorded no " +
    "disposition at all for that traffic — no trace received, no noise " +
    "discarded, no inactive-agent drop. Counts every disposition, not just " +
    "traces received, because a noise-only or inactive-agent-only window " +
    "legitimately records nothing there and would otherwise false-fire.",
  memory_pressure:
    "Fires when sampled resident memory divided by the container limit " +
    "crosses the threshold — the same ratio the Overview memory-headroom " +
    "tile shows inverted. A FLEET AVERAGE, not a per-replica max: with more " +
    "than one ingest task, one replica at 99% beside one at 1% reads 50% " +
    "and cannot fire.",
  restart_churn:
    "Fires on the raw count of process boots in the window, not a ratio — a " +
    "healthy service boots once and stays up, so any repeat count is already " +
    "the kill loop this rule exists to catch.",
  unclean_shutdown:
    "Fires on the raw count of undecided-spans-in-memory shutdowns in the " +
    "window, not a ratio — a single kill that skipped the drain is already " +
    "the loss this rule exists to catch.",
};

export const ALERT_RULE_ORDER: AlertRule[] = [
  "error_rate",
  "write_failure",
  "limit_breach",
  "quarantine_spike",
  "promotion_stall",
  "stream_delivery_loss",
  "stream_capture_stall",
  "stream_receipt_disconnect",
  "memory_pressure",
  "restart_churn",
  "unclean_shutdown",
];

// ---------------------------------------------------------------------------
// Quarantine / gated / failed grouping (spec §3.6 FR-H1)
// ---------------------------------------------------------------------------

export const FORWARD_STATUS_LABELS: Record<ForwardStatus, string> = {
  quarantined: "Quarantined",
  gated: "Gated",
  failed: "Failed",
};

export const FORWARD_STATUS_HELP: Record<ForwardStatus, string> = {
  quarantined: "Forwarding was refused — the reason column says why.",
  gated: "Operator withholds — a service or tenant forward-gate is disabled.",
  failed: "Trace-store write exhausted — silent data loss, worth surfacing.",
};

/** Forward-gate lever helper — the internal service/tenant toggles are a
 *  flush-time forward-gate (D16), not a receipt-level load-shed. */
export const FORWARD_GATE_HELP =
  "Stops forwarding + scoring; does not reduce ingest load — disable the point to shed load.";

/** All reason values, grouped by the status that owns them. */
export const QUARANTINE_REASONS = [
  "unknown_tenant",
  "unresolved_identity",
  "no_scoreable_span",
] as const;
export const GATE_REASONS = ["service_disabled", "tenant_disabled"] as const;

/** The reason vocabulary the writer actually produces, per
 *  `RoutedTraceSignature.quarantine_reason` / `.gate_reason`. Keyed by STEM, so
 *  the suffixed reasons resolve here too. `trace_store_exhausted` is gone: it
 *  was never a stored value, only a label this module invented for a `failed`
 *  row, which made it permanently unfilterable. */
export const REASON_LABELS: Record<string, string> = {
  invalid_tenant_name: "Invalid tenant name",
  unresolved_identity: "Unresolved identity",
  routed_agent_unavailable: "Routed agent unavailable",
  routed_agent_sk_decrypt_failed: "Routed agent key decrypt failed",
  forward_failed: "Forward failed",
  no_scoreable_span: "Nothing scoreable in the trace",
  service_disabled: "Service disabled",
  tenant_disabled: "Tenant disabled",
  unknown_tenant: "Unknown tenant (legacy)",
  unknown: "Reason not recorded",
};

/** Written only by an earlier internal-routing path; see
 *  `RoutedTraceSignature.quarantine_reason` ("Legacy 'unknown_tenant' may
 *  appear on earlier rows"). Named rather than inlined because the
 *  register-and-clear affordance and its purge request must agree on it. */
export const LEGACY_UNKNOWN_TENANT_REASON = "unknown_tenant";

/** Every value the writer can store, and nothing else — the server matches a
 *  stem plus its `:suffix` variants, so the three suffixed reasons are offered
 *  by stem. It previously offered `trace_store_exhausted`, which is not a stored
 *  value at all, and omitted `invalid_tenant_name` and all three suffixed
 *  reasons, so the reason dominating real traffic was unselectable while an
 *  invented one returned empty. */
export const REASON_OPTIONS = [
  { value: "invalid_tenant_name", label: REASON_LABELS.invalid_tenant_name },
  { value: "unresolved_identity", label: REASON_LABELS.unresolved_identity },
  {
    value: "routed_agent_unavailable",
    label: REASON_LABELS.routed_agent_unavailable,
  },
  {
    value: "routed_agent_sk_decrypt_failed",
    label: REASON_LABELS.routed_agent_sk_decrypt_failed,
  },
  { value: "forward_failed", label: REASON_LABELS.forward_failed },
  { value: "no_scoreable_span", label: REASON_LABELS.no_scoreable_span },
  { value: "service_disabled", label: REASON_LABELS.service_disabled },
  { value: "tenant_disabled", label: REASON_LABELS.tenant_disabled },
  // Legacy: only on rows written before internal routing resolved the tenant.
  // Retained because `registerClear` targets exactly these.
  { value: LEGACY_UNKNOWN_TENANT_REASON, label: REASON_LABELS.unknown_tenant },
];

// ---------------------------------------------------------------------------
// Stream gap reasons (spec §3.4 E1/E7/E11, `/stream/gaps` `reason` column)
// ---------------------------------------------------------------------------

/** Every loss isn't a retention-horizon expiry — a heap eviction (buffer
 *  overflow) and a malformed row are equally "permanently lost", just for a
 *  different reason. Labels the gap table's Reason column so the two aren't
 *  visually collapsed into one retention-only story. */
export const STREAM_GAP_REASON_LABELS: Record<string, string> = {
  retention_floor: "Retention expiry",
  retention_floor_stale_cursor: "Retention expiry (stream stalled)",
  heap_eviction: "Buffer overflow",
  malformed_row: "Malformed row",
  malformed_payload: "Malformed payload",
  malformed_payload_forward_build: "Malformed payload (on forward)",
};

// ---------------------------------------------------------------------------
// Stream counters (spec §4.3 `StreamCounters`)
// ---------------------------------------------------------------------------

/** Retried-count tile flips to an "elevated" warning delta past this count
 *  (rolling 24h window, `StreamCounters`). */
export const STREAM_RETRIED_ELEVATED_THRESHOLD = 100;

/** Lost-count tile flags "loss recorded" once any drop occurs — dropped
 *  spans are terminal-as-lost, so even one is worth a delta, not just a
 *  large count. */
export const STREAM_DROPPED_LOSS_THRESHOLD = 0;

/** A quarantine row's reason column — `quarantineReason` for identity failures,
 *  `gateReason` for gated withholds.
 *
 *  Returns what is STORED, never a guess. This used to substitute a plausible
 *  cause when the column was null and invent `trace_store_exhausted` outright
 *  for a `failed` row — a value the writer never produces (only `forwarded`,
 *  `quarantined` and `gated` are ever written). The invented values then fed
 *  both the row grouping and the Reason filter's vocabulary, so a row could sit
 *  under a heading that no filter value could ever match. A row whose reason
 *  was not recorded is `UNKNOWN_REASON`, which is true and equally unfilterable
 *  — but visibly so. */
export const UNKNOWN_REASON = "unknown";

export function reasonForRow(row: {
  forwardStatus: ForwardStatus;
  quarantineReason?: string | null;
  gateReason?: string | null;
}): string {
  if (row.forwardStatus === "gated") return row.gateReason ?? UNKNOWN_REASON;
  return row.quarantineReason ?? UNKNOWN_REASON;
}

/** The filterable stem of a reason.
 *
 *  Three reasons carry a variable suffix — `routed_agent_unavailable:{agent_id}`,
 *  `routed_agent_sk_decrypt_failed:{agent_id}`, `forward_failed:{transport}` —
 *  so grouping by the raw value would produce one group per agent or per
 *  transport error, none of them matching a filter option. Grouping by the stem
 *  mirrors what the server's Reason predicate matches. */
export function reasonStem(reason: string): string {
  const colon = reason.indexOf(":");
  return colon === -1 ? reason : reason.slice(0, colon);
}

// ---------------------------------------------------------------------------
// Metrics (spec §7 / mock Metrics tab)
// ---------------------------------------------------------------------------

export type MetricFormat = "tps" | "bytes" | "percent" | "count";

export interface MetricDef {
  metric: string;
  label: string;
  format: MetricFormat;
  tone: "accent" | "info" | "success" | "warning" | "destructive" | "muted";
}

/** The chartable derived metrics offered on the Metrics tab. */
export const METRIC_DEFS: MetricDef[] = [
  { metric: "tps", label: "TPS (1-min avg)", format: "tps", tone: "accent" },
  {
    metric: "avg_trace_size_bytes",
    label: "Avg trace size",
    format: "bytes",
    tone: "info",
  },
  {
    metric: "error_rate",
    label: "Error rate",
    format: "percent",
    tone: "destructive",
  },
  {
    metric: "write_success",
    label: "Write success",
    format: "percent",
    tone: "success",
  },
  {
    metric: "quarantine_rate",
    label: "Quarantine rate",
    format: "percent",
    tone: "warning",
  },
  {
    metric: "memory_utilization",
    label: "Memory utilization",
    format: "percent",
    tone: "warning",
  },
];

export function formatMetricValue(
  value: number,
  format: MetricFormat,
): string {
  switch (format) {
    case "tps":
      return fmtTps(value);
    case "bytes":
      return fmtBytes(value);
    case "percent":
      return fmtPercent1(value);
    case "count":
      return fmtCount(value);
  }
}

/** Event types the platform emits — drives the Activity filter list.
 *
 * Typed from the generated contract (`IngestionEventType` in
 * `packages/common/.../ingestion/events.py`), so an option the server would
 * refuse is a compile error. The predecessor was `readonly string[]` copied from
 * the design mock at `.work/tasks/ingestion-control-monitoring/mocks/data.js`:
 * 13 of its 16 options were never emitted by anything and 8 real types — among
 * them `ingestion.control_upserted`, the row every enable/disable writes — could
 * not be selected at all. `format.test.ts` set-differences this list against the
 * contract, which is what catches an OMISSION (the annotation alone accepts a
 * short list, and a short list is a real event no operator can filter for). */
export const EVENT_TYPE_OPTIONS: readonly IngestionEventType[] = [
  "ingestion.alert_acknowledged",
  "ingestion.alert_opened",
  "ingestion.alert_resolved",
  "ingestion.alert_rule_updated",
  "ingestion.control_upserted",
  "ingestion.controls_stale",
  "ingestion.quarantine_purged",
  "stream.config_updated",
  "stream.cursor_lag_backpressure",
  "stream.reset",
  "stream.retention_gap",
  "stream.skipped_position",
];

/** The activity log's severity scale — `error`, not `critical`.
 *
 * `critical` belongs to the finding-severity scale and the server rejects it 422;
 * offering it while omitting `error` meant an operator could not filter the log
 * down to errors at all. */
export const SEVERITY_OPTIONS: readonly IngestionEventSeverity[] = [
  "info",
  "warning",
  "error",
];

/** severity → status-dot / chip tone.
 *
 * Takes `string` because `EventRow.severity` and `AlertRow.severity` are both
 * `str` on the wire (an activity log stays readable when a row predates a
 * vocabulary change), so `muted` is a reachable fallback rather than dead code. */
export function severityTone(
  severity: string,
): "info" | "warning" | "destructive" | "muted" {
  switch (severity) {
    case "error":
      return "destructive";
    case "warning":
      return "warning";
    case "info":
      return "info";
    default:
      return "muted";
  }
}

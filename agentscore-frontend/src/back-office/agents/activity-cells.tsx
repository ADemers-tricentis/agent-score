/** Back-office-only cell renderers for the agents-list columns (spec:
 *  agents-list-activity-columns §3.1 Feature 2, §4.6, §6.6; Source/
 *  Provisioning: agents-grouped-view spec §3.1 Feature 4).
 *
 * Both `TenantAgentsPage` (over `AgentProfile`) and `AgentsSearchPage` /
 * `AgentGroupSection` (over `FlatAgentListItem` → `i.agent`) render the same
 * columns from the same `AgentProfile` shape, so the cells are factored here
 * to avoid drift between the several `ColumnDef` arrays that consume them.
 *
 * The Traces / Last active / Score cells now live in
 * `shared/components/activity-cells.tsx` — the customer list renders them
 * too. What stays here reads `kind`, `provisioning_status` and the agent-fit
 * projection, which the customer model does not carry.
 */

import type { ReactNode } from "react";

import Box from "@mui/material/Box";
import Tooltip from "@mui/material/Tooltip";
import IconMaterialSymbolsHub from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsHub.mjs";

import type { FakeFitStatus as AgentFitStatus, FakeAgent as AgentProfile } from "@/back-office/agents/fake-data";
import { NO_ENABLED_CHECKS_COPY } from "@/back-office/agents/scoring/run-format";
import { fallbackClassTint } from "@/back-office/scoring-pipeline/format";
import { Chip } from "@/shared/components/chip";
import { StatusDot } from "@/shared/components/status-dot";

/** `source_service` origin tag for the agents-list Source column (§3.9).
 *  Internal agents show the outline hub chip; external agents' service is
 *  always `'external'`, so the cell is a muted em-dash. */
export function SourceCell({ agent }: { agent: AgentProfile }) {
  if (agent.kind !== "internal")
    return (
      <Box component="span" sx={{ color: "text.secondary" }}>
        —
      </Box>
    );
  return (
    <Chip tint="outline" icon={IconMaterialSymbolsHub}>
      {agent.source_service}
    </Chip>
  );
}

/** Soft-deletion, as a compact badge beside the agent name.
 *
 * This used to be `ProvisioningBadge` and rendered four states. Three of them
 * — `active` / `provisioning` / `failed` — are now the Stage column's job:
 * `connecting` covers both non-active ones and carries a REASON the badge
 * never had, and a row cannot afford two status indicators that could
 * disagree. `deleted` stays here because it is not a pipeline stage at all:
 * the lifecycle derivation never reads `deleted_at`, so absorbing this too
 * would have left the "Show deleted" view with no way to tell a soft-deleted
 * agent from a live one. The failed provision's `failure_reason` text moved
 * with the state that owns it — it is the Stage chip's tooltip now.
 */
export function DeletedBadge({ agent }: { agent: AgentProfile }) {
  if (!agent.deleted_at) return null;
  return (
    <Box component="span" sx={{ flexShrink: 0 }}>
      <StatusDot status="destructive">deleted</StatusDot>
    </Box>
  );
}

/** Deactivation (agent activation gate), as a compact badge beside the agent
 *  name — the same slot `DeletedBadge` occupies, and for the same reason:
 *  this table has no dedicated Status column, and the Stage column beside it
 *  is suppressed for a deactivated agent (its pipeline stage keeps computing,
 *  but showing it would read as live on an agent whose work has actually
 *  stopped). Without this badge that leaves a blank Stage cell with nothing
 *  explaining it — this is the explanation.
 *
 *  Mutually exclusive with `DeletedBadge`: a soft-deleted agent is always
 *  also deactivated (the DB CHECK `agents_deleted_implies_deactivated`), and
 *  `deleted` is the more specific, more final fact — so this renders nothing
 *  when `deleted_at` is set, the same precedence `AgentBadges` uses on the
 *  agent detail header. */
export function InactiveBadge({ agent }: { agent: AgentProfile }) {
  if (agent.deleted_at || !agent.deactivated_at) return null;
  return (
    <Box component="span" sx={{ flexShrink: 0 }}>
      <StatusDot status="muted" data-testid="agent-inactive-badge">
        Inactive
      </StatusDot>
    </Box>
  );
}

/** Flags the pre-loaded walkthrough agent shown to a brand-new tenant
 *  ("blank / new login" demo state) so it never reads as one of the
 *  operator's own connected agents. */
export function SampleBadge({ agent }: { agent: AgentProfile }) {
  if (!agent.is_sample) return null;
  return (
    <Box component="span" sx={{ flexShrink: 0 }}>
      <StatusDot status="info" data-testid="agent-sample-badge">
        Sample
      </StatusDot>
    </Box>
  );
}

/** `AgentFitStatus` → attention-marker tooltip text (spec §3.3 "Cell
 *  rendering by state"). `binding_invalid` is checked directly (rather than
 *  via `attention_reason`, which the backend may or may not set for a
 *  purely-archived binding) so "profile archived" / "pinned profile
 *  archived" always renders regardless of how the backend populates
 *  `attention_reason` in that case; the `attention_reason` sub-reasons take
 *  precedence when present (e.g. a fallback on an archived profile still
 *  surfaces the fallback wording). */
function attentionTooltipText(fit: AgentFitStatus): string {
  if (fit.attention_reason === "fallback") {
    return "Last fit fell back to the heuristic.";
  }
  if (fit.attention_reason === "low_confidence") {
    return "LLM fit confidence below the attention threshold.";
  }
  if (fit.attention_reason === "no_applicable_profile") {
    return "Automatic fitting is paused for this agent.";
  }
  if (fit.binding_invalid) {
    return fit.binding_source === "pinned"
      ? "Pinned profile archived."
      : "Profile archived.";
  }
  return "Needs profile attention.";
}

/** Unified attention marker (spec §3.3 Step C) — shown whenever
 *  `needs_profile_attention OR binding_invalid`. Mirrors `ProfileFitTab`'s
 *  `AttentionChip` (warning `Chip` in a `Tooltip`, wrapped in a plain `Box`
 *  span since `Chip` has no `forwardRef`); a BUG-class fallback tints
 *  `destructive` instead (mirrors `fallbackClassTint`). */
function FitAttentionMarker({ fit }: { fit: AgentFitStatus }) {
  const tint =
    fit.attention_reason === "fallback"
      ? fallbackClassTint(fit.fallback_class)
      : "warning";
  return (
    <Tooltip title={attentionTooltipText(fit)}>
      <Box component="span" data-testid="fit-attention-marker">
        <Chip tint={tint}>Needs attention</Chip>
      </Box>
    </Tooltip>
  );
}

/** Shared muted "unknown" render — used both when `fit_status` is absent
 *  (missing benchmark row) and when a fitted state has no `profile_name`
 *  (should not happen under FK RESTRICT, spec §3.4). Same output,
 *  one definition. */
const UNKNOWN = (
  <Box
    component="span"
    sx={{ color: "text.secondary" }}
    data-testid="fit-status-cell"
  >
    unknown
  </Box>
);

/** Profile-fit status cell for the flat Agents list (spec §3.3 "Cell
 *  rendering by state") — a pure render over the page-scoped, persisted-only
 *  `AgentFitStatus` projection; no live fit computation happens here. */
/** Profile name on one line, its chips on the next — the same two-line shape
 *  the Score column uses. Name and chips on a single line measured wider than
 *  this column's share of a fixed-layout table, so the chip printed over its
 *  neighbour. The name truncates; the chips get a full line and never clip.
 *  Carries the cell test id so every branch built through it keeps one. */
function FitProfileStack({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        gap: 0.5,
        minWidth: 0,
      }}
      data-testid="fit-status-cell"
    >
      <Tooltip title={label}>
        <Box
          component="span"
          sx={{
            maxWidth: "100%",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {label}
        </Box>
      </Tooltip>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 0 }}>
        {children}
      </Box>
    </Box>
  );
}

export function FitStatusCell({
  item,
}: {
  item: { fit_status?: AgentFitStatus | null };
}) {
  const fit = item.fit_status;

  if (!fit) {
    return UNKNOWN;
  }

  const showAttention = fit.needs_profile_attention || fit.binding_invalid;
  const isFitted = fit.state === "fitted_auto" || fit.state === "fitted_pinned";

  // Should not happen under FK RESTRICT (spec §3.4) — but a
  // nameless fitted row renders `unknown`.
  if (isFitted && fit.profile_name == null) {
    return UNKNOWN;
  }

  // Ahead of the fitted branch below (spec §3.3), and deliberately
  // scoped to the FITTED states only. An agent pinned to a profile that
  // happens to be empty reports `state: "fitted_pinned"` and would otherwise
  // render a healthy-looking green/blue chip; auto-fit does not run for
  // pinned agents, so its only exit is a human.
  //
  // The `isFitted &&` guard is load-bearing, not defensive. the
  // seeded default carries no checks, so `has_enabled_checks` is false for
  // EVERY agent that has not yet adopted a real profile. An unguarded check
  // here would preempt `awaiting_traces`, `awaiting_fit`,
  // `no_applicable_profile` and the `default` fallback below, firing on the
  // ordinary onboarding path and hiding the capture-progress chip — a marker
  // that flags every new agent cannot discriminate the stuck ones it exists
  // for. A default-bound empty agent is already covered by the `default`
  // branch at the bottom, which is why spec §3.1 Feature 9 re-tints it.
  if (isFitted && fit.has_enabled_checks === false) {
    return (
      <FitProfileStack label={fit.profile_name ?? "unknown"}>
        <Tooltip title={NO_ENABLED_CHECKS_COPY.listTooltip}>
          <Box component="span" data-testid="fit-no-checks-marker">
            <Chip tint="warning">{NO_ENABLED_CHECKS_COPY.listChip}</Chip>
          </Box>
        </Tooltip>
        {showAttention ? <FitAttentionMarker fit={fit} /> : null}
      </FitProfileStack>
    );
  }

  if (isFitted) {
    const tint = fit.state === "fitted_auto" ? "success" : "info";
    const label = fit.state === "fitted_auto" ? "auto" : "pinned";
    return (
      <FitProfileStack label={fit.profile_name ?? "unknown"}>
        <Chip tint={tint}>{label}</Chip>
        {showAttention ? <FitAttentionMarker fit={fit} /> : null}
      </FitProfileStack>
    );
  }

  if (fit.state === "awaiting_traces") {
    return (
      <Box data-testid="fit-status-cell">
        <Chip tint="outline">
          {fit.captured}/{fit.threshold} traces
        </Chip>
      </Box>
    );
  }

  if (fit.state === "awaiting_fit") {
    return (
      <Box data-testid="fit-status-cell">
        <Chip tint="outline">Awaiting fit</Chip>
      </Box>
    );
  }

  if (fit.state === "no_applicable_profile") {
    return (
      <Box
        sx={{ display: "flex", alignItems: "center", gap: 1 }}
        data-testid="fit-status-cell"
      >
        <Chip tint="warning">No applicable profile</Chip>
        <FitAttentionMarker fit={fit} />
      </Box>
    );
  }

  return (
    <Box data-testid="fit-status-cell">
      <Chip tint="warning">Default — not scored</Chip>
    </Box>
  );
}

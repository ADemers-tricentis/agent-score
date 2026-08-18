# Docs ↔ Product Drift Log

Tracks every place the customer-facing docs (`src/content/*.tsx`) disagree with the
live product at `https://agent-score-customer.product.tricentis.com`.

**Direction of truth:** the **live product is authoritative for what is true today.**
Where a row is marked _product-should-catch-up_, the docs describe the intended
end-state and the gap is a product to-do, not a docs error. Where a row is marked
_docs-should-update_, the docs are simply stale and should be corrected.

Each audit appends a dated section. Newest first.

---

## 2026-08-18 — follow-up audit + fixes (Playwright walkthrough, multiple tenants)

Continuation of the 2026-08-17 audit below. Confirmed several of that audit's
open items firsthand and fixed the ones the user approved.

**Resolved this pass** (docs edited, see CHANGELOG):
- #1 (API key naming + self-serve gap) - confirmed directly: `/integrations`
  has full self-serve New key / Rotate / Revoke, tenant-scoped, `tk_` prefix.
  This is a **brand-new feature**, not just a naming fix - docs previously told
  customers to ask the team for key rotation, which is no longer true.
- #2 (VPN-only ingest) - added.
- #3 (agent states) - corrected to Setting up -> Learning your agent (n/20) ->
  Scored / Needs attention.
- #4 (OTel specifics) - added exact env var names and the bearer-token header
  format.
- #8 (schedule specifics from the older list's #8) - added cadence/lookback
  constraints and the Autonomous scoring toggle.
- #10 (scoring-engine page) - confirmed judge-model choice and a usage log do
  **not** exist anywhere in the customer app (checked Profile, Agents,
  Integrations, Settings). Pass thresholds are real, confirmed live on each
  agent's Profile tab. Reframed the doc accordingly.
- #9 (Agent Card latency/cost envelope) - **root cause found**: the doc's
  screenshot (`agent-card-customer.png`) was captured from an internal
  design-prototype tool (visible "CUSTOMER WEB APP · BASELINE" toolbar in the
  original image), not the live product, and was mislabeled as "an actual
  Agent Card from the Agent Score app." Confirmed on two different live agents
  that no latency/token/cost figures render anywhere on the real Agent Card.
  Replaced the screenshot with a genuine capture and removed the envelope
  claim from the prose. The envelope itself is a real design intent that was
  never built - logged below as a product gap, not restored to the docs.

**New finding (not yet actioned):**
- #11 - eval-catalog's family table lists "Tool Correctness" and "Argument
  Correctness" under the "Agentic & Tool-use" family. On a live profile
  (rag-support-agent, Tool/Orchestrator Starter v2), both evals are actually
  assigned to the **correctness** dimension, not agentic_tool_use. Direction
  unclear - the catalog's "family" may be a browsing taxonomy independent of
  a profile's dimension assignment, which would make this not a bug. Held for
  a broader check before editing either the docs or flagging it as a product
  issue.

**Still open from 2026-08-17** (not touched this pass):
- #5, #6 (verdict-label / letter-grade inconsistencies) - product-should-catch-up,
  intentionally left as-is per direction-of-truth rules.
- #7 (profile naming / undocumented "Default v1" profile) - needs the broader
  multi-tenant pass the original audit flagged.

---

## 2026-08-17 — audit (Playwright walkthrough, tenant: andrew-test-tenant + fleet view)

Scope note: audited the connect flow, the Agents dashboard, one scored agent's
Score / Agent Card / Profile / Activity tabs, and Account settings. Items 7, 9,
and 10 need a broader multi-tenant pass to fully confirm.

| # | Doc page | Docs say | Production shows | Severity | Direction |
|---|----------|----------|-----------------|----------|-----------|
| 1 | connect-your-agent | "API key" (team "mints your first API key") | Called an **ingest key**, prefix `tk_`, one per external tenant | High | docs-should-update |
| 2 | connect-your-agent | No network restriction mentioned | "The ingest endpoint is reachable over the **Tricentis VPN only**." | High | docs-should-update |
| 3 | connect-your-agent | Agent appears in a **"Collecting data"** state | Real states: **"Setting up"** (0 traces) → **"Learning your agent" (n / 20 traces)** → **"Scored" / "Needs attention"** | High | docs-should-update |
| 4 | connect-your-agent | "two additional lines added to an exporter" (no specifics) | Exact env vars shown: `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT=…/external/otel/v1/traces` and `…_TRACES_HEADERS=Authorization=Bearer <tk_…>`; warns to use the `_TRACES_`-suffixed form | Low (enhance) | docs-should-update |
| 5 | scorecard / welcome / glossary | Verdict labels: **Ship / Ship (with note) / Review required / Block recommended / Block** | Per-run + score-header labels customers see: **Ship / Ship with note / Needs work / Don't ship (recommended) / Don't ship**. NOTE: the Profile "bar" view still uses the formal Review/Block labels — the **product itself is internally inconsistent** and should be reconciled | High | product-should-catch-up (reconcile the two label sets) |
| 6 | welcome / glossary | "a 0-100 score, **a letter grade**, and a ship/review/don't-ship recommendation" | **No letter grade** anywhere — score + verdict only | High | product-should-catch-up (docs promise a grade the product doesn't yet render) |
| 7 | dimensions-and-profiles | Ships **seven** profiles: RAG, Computer-Use, Conversational, Tool-Orchestrator, Code, Structured-Generation, EvalClaw | Observed naming: **"… Starter v<n>"** (Tool / Orchestrator Starter v2, Code Starter v1, Structured Generation Starter v1) **plus a "Default v1"** profile docs never mention. RAG / Computer-Use / Conversational / EvalClaw not seen in this tenant set | Med (verify full catalog) | mixed — docs naming stale; "Default" profile undocumented |
| 8 | scoring-over-time | "Set an interval… in minutes" + generic "lookback window" | **Cadence (minutes), min 60**; **Lookback (days), 1–90**; plus an **"Autonomous scoring"** toggle and inherit-the-global-default behavior | Med | docs-should-update |
| 9 | agent-card | An **"Inferred" badge** marks judge interpretations; card carries **latency and cost envelopes** alongside observed tools | Purpose labeled "**Synthesized by the judge model — a draft, not a verified declaration**"; tools note "Descriptions are inferred." **No latency/cost envelope** visible on the card | Med (verify) | mixed — badge wording stale (docs); envelope may be product-should-catch-up |
| 10 | scoring-engine | Reads like a dedicated "Scoring engine settings" area (pass thresholds, judge model, usage log) | `/settings` is an **Account** page (identity, tenants, change password). Thresholds live **per-profile** (Profile tab). Judge-model / usage-log UI not found — location unconfirmed | Med (verify) | docs-should-update (relocate/reframe) once location confirmed |

### Additional product observations (not yet in docs)
- Score tab surfaces a **confidence band** ("Score another sample and you'd likely get 64–78"), a **Partial / Provisional run** concept, and eval-count breakdown (**scored / skipped / failed / retired**) with a "**Why evaluations failed**" explainer stating failures shrink evidence rather than lower the score.
- Agent detail URL is **`/tenants/<tenantId>/agents/<agentId>`** (not `/agents/<id>`).
- Activity tab shows a full run history with per-run trigger (manual / scheduled / rescore), score, verdict, scored count, and state (complete / partial).

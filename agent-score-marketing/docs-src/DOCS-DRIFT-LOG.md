# Docs ↔ Product Drift Log

Tracks every place the customer-facing docs (`src/content/*.tsx`) disagree with the
live product at `https://agent-score-customer.product.tricentis.com`.

**Direction of truth:** the **live product is authoritative for what is true today.**
Where a row is marked _product-should-catch-up_, the docs describe the intended
end-state and the gap is a product to-do, not a docs error. Where a row is marked
_docs-should-update_, the docs are simply stale and should be corrected.

Each audit appends a dated section. Newest first.

---

## 2026-08-27 — GitHub merge scan + production walk, using AgentScore Updates.md

Cross-checked `docs/updates/AgentScore Updates.md`'s Aug 26/27 entries against a
GitHub merge scan (24 PRs merged on `Tricentis-AI/agent-score` since the
`.last-github-sync` marker of 2026-08-26T15:00:06Z) and a fresh Playwright walk of
production, logged in as a superadmin.

**Merge scan:** of 24 PRs, the customer-facing/billing-visible ones (LLM catalog
pricing + the OpenAI cached-token double-billing fix, the new internal usage/spend
report, the trace-assembly rebuild, the bad-span-type fix) were all already written
up in `AgentScore Updates.md`'s Aug 27 entry - none require a `docs-src` change,
since none of that work touches anything the onboarding docs describe (it's
internal admin/billing tooling). The rest (DB migration fix, ingest concurrency,
infra vCPU bump, `agent-tools` bounded-tool-surface groundwork with no transport
yet, ECS diagnostics) are internal-only. No `docs-src`-relevant PRs found beyond
PR #407 (already logged below, still open).

**Resolved this pass** (docs edited, see CHANGELOG 0.36.0):
- `scorecard`, `glossary` - verdict names were stale: docs said Ship / Ship (with
  note) / Review required / Block recommended / Block. Live Score tab badges and
  the Activity/Runs table now show Ship / **Ship with note** / **Needs work** /
  **Don't ship (recommended)** / Block. Confirmed live across three different
  agents and cross-checked against the Activity tab's Runs table for the same
  scores. Direction: **docs-should-update**. Severity: high.
  - Note: **"Needs work" is not a new term** - the 2026-08-24 entry below records
    it being *removed* from a screenshot as stale prototype wording ("61/100,
    Needs work, 24 below") believed not to reflect the real product. It turns out
    that wording shipped for real between then and now. Worth remembering next
    time a screenshot looks like it's using "placeholder" copy - it may be a
    preview of what's coming.
- `connect-your-agent` - closes the **"Connect an agent" wizard** gap first
  flagged 2026-08-26 (see below) and left unapplied at that review gate. Added a
  screenshot and callout for the Agents page's + Add agent → guided tenant-key +
  exporter-config modal. Also corrected the doc's stated reason for using the
  `_TRACES_`-suffixed OTel variables (was: separates traces from logs/metrics;
  actually: prevents `/v1/traces` from being appended to the ingest path twice) -
  the real reason is now shown directly in-app in that same wizard. Direction:
  **docs-should-update**. Severity: medium (wizard gap), medium (wrong rationale).
- `agent-card` - screenshot caption quoted "Synthesized by the judge model";
  live copy reads "Synthesized by the model" (no "judge"). Direction:
  **docs-should-update**. Severity: low.
- `scorecard` - added a short section on the predictive score range and
  "close to the line" callout the Score tab shows near a verdict boundary
  (e.g. "Score another sample and you'd likely get 66-80"), previously
  undocumented. Direction: **docs-should-update**. Severity: low.

**Still outstanding (not touched this pass):**
- **PR #407 structural finding** (below, 2026-08-26) remains unresolved - user
  direction this run was again to keep auditing/editing `docs-src` as-is and treat
  ownership of the customer docs (`docs-src` vs. the in-app ported copy) as a
  separate decision. Reconfirmed live: both `https://agent-score-customer.product.tricentis.com/docs`
  (the ported in-app copy) and the old standalone docs site both return 200 today.
- Could not confirm the live label for the 0-39 ("Block") band - found no agent
  scored below 40 during this walk. Left as "Block" (unchanged) on the assumption
  the rename pattern (Ship with note / Needs work / Don't ship (recommended))
  didn't touch the bottom tier, but this is unverified.
- **Product-internal inconsistency, logged only, no doc action:** the same
  agent's **Profile tab** "The bar" verdict-bands table still shows the *old*
  labels ("Review required", "Block recommended") while its Score tab and
  Activity log use the new ones for the identical score. The docs' own
  `profile-tab.png` screenshot (still showing "Review required") is therefore
  still an accurate capture of that specific tab - only the Score-tab-facing
  Scorecard/Glossary pages needed the update. Direction:
  **product-should-catch-up** (the Profile tab's own table is stale, not the
  docs).

---

## 2026-08-26 — GitHub merge scan + production walk (Playwright, multi-agent)

First run using the new step-3 GitHub merge scan (added to the `agent-score-docs-sync`
skill this session). Scanned 92 PRs merged on `Tricentis-AI/agent-score` since
2026-08-12 (no `.last-github-sync` marker existed yet, so used the 14-day default).
Kept 3 as customer-facing/onboarding-relevant, dropped the other 89 as internal
infra/back-office/scoring-pipeline work (the Langfuse → Postgres + object-store
migration, skills tooling, ops/alerting, etc.).

**⚠️ Structural finding, not a per-page discrepancy - flagged prominently per user
direction:**
- **PR #407** (`feat(customer): add a Docs section to the customer app`, merged
  2026-08-26) ports all 10 guide pages and 7 diagrams from **this project**
  (`agent-score-marketing/docs-src`) directly into the `agent-score` repo's customer
  app frontend as hand-edited source, rendered at a new `/docs` nav-rail item. The
  PR description calls `docs-src` **"the retired ... project"** and the port
  **"a one-time port, not an ongoing sync."** Confirmed live in production today:
  logging in and opening the book icon (the new 4th nav-rail item) shows `/docs`
  with the identical nav structure and Welcome-page copy this project currently
  has. **This means the docs this skill audits and rebuilds are no longer
  guaranteed to be what real customers see in-product** - the source of truth for
  onboarding docs may now be inside the `agent-score` repo, which this skill has
  no access to edit. User direction this run: keep auditing/editing `docs-src` as
  before, but surface this for a separate decision (retire `docs-src`, redirect its
  published site, or repoint this skill at `agent-score`).

**New findings this pass, pending review-gate approval:**
- `connect-your-agent` - undocumented **"Connect an agent" dialog**: the Agents
  page's "+ Add agent" button opens a guided 4-step modal (pick the tenant → see
  its ingest key → exporter config with a copy-button env-var block → "what
  happens next") that covers most of what the doc currently only describes via a
  separate trip to the Integrations page plus manual OTel instructions. Also
  confirms PR #393's fix is live: the tenant picker now includes zero-agent
  tenants (`andrew-new-tenant` was selectable and showed its key), where before
  that PR the picker excluded exactly the tenant a first-time user needs.
  Direction: **docs-should-update**. Severity: high (a real, prominent, live entry
  point is completely undocumented).
- `dimensions-and-profiles` - **advances open item #7** (2026-08-17, still open as
  of 2026-08-24): the "ships seven profiles" claim is stale. Two different live
  agents (`jira epic poller`, `overlap-cap3-test_delay_agent (2)`) are scored
  against a profile named **"General Starter v1 (Auto)"** - not one of the seven
  named profiles, and not the "Default v1" name seen on 2026-08-17 (renamed since,
  or a second undocumented fallback). Assigned when "evidence diversity 1.000
  still below the 3.0 threshold." Carries exactly 4 dimensions (Correctness,
  Relevance, Safety, Quality Efficiency), weight 1 each, 1 eval each - much
  simpler than the doc's description of a full weighted profile. This is likely
  the *first* profile most newly-connected agents actually get. Direction:
  **docs-should-update**. Severity: high (affects most fresh agents, per both
  examples seen).
- Screenshots showing the customer-app sidebar are stale by one icon across every
  page that has one (`welcome`, `connect-your-agent`, `dimensions-and-profiles`,
  `scorecard`, `scoring-over-time`, `agent-card`) - production's nav rail now has
  4 icons (Agents / Integrations / Settings / the new Docs book icon from PR
  #407), confirmed directly against `integrations-tab.png`. Direction:
  **docs-should-update**. Severity: low (cosmetic, but touches 6 images).
- `scoring-engine` vs `glossary` - **docs-internal inconsistency**, found reading
  step 2, not a prod comparison: Glossary's "Judge model" entry says "You choose
  which provider and model to use," directly contradicting `scoring-engine`'s own
  (already-confirmed-accurate per 2026-08-18 item #10) statement that provider
  choice "isn't yet a self-serve setting in the app." Direction:
  **docs-should-update** (reword Glossary to match `scoring-engine`). Severity:
  medium.

**Noted, not actioned (pending-verification):**
- PR #411 (`feat(llm-catalog): LLM Inference catalog — rename, cache pricing,
  per-task routing`) renames the back-office judge-model concept and adds
  per-task routing, but the rename is back-office-only (`/admin/judges` →
  `/admin/llm-inferences`) - nothing customer-facing changed yet. Worth
  re-checking on a future pass in case it's a precursor to customer-facing
  judge-model choice, which would finally resolve the glossary/scoring-engine
  contradiction above in the other direction.
- PR #347 (self-service API key management) was flagged by the merge scan but
  already matches what `connect-your-agent` documents today - good corroboration,
  no action needed.

**Confirmed accurate this pass (no change needed):** the Integrations page
(tenant selector, API keys table, New key / Rotate / Revoke), the Score tab
(composite score, verdict, confidence band, scored/skipped/failed/retired
counts), the Agent Card tab ("Synthesized by the judge model" wording, behavioral
patterns/success criteria/failure modes), the Profile tab's Autonomous scoring /
cadence (60 min minimum) / lookback (1-90 days) controls, the Activity tab's
run timeline, and `/settings` as the Account page.

---

## 2026-08-24 — internal-agent onboarding + screenshot refresh (Back Office + customer app, Playwright)

Triggered by updating `connect-your-agent`'s internal-agent-ingestion steps against
`docs/documentation/internal-agent-onboarding-runbook.md`, then auditing the rest of
the site against production while in there.

**Resolved this pass** (docs edited, see CHANGELOG):
- Internal Tricentis agents were documented as "ingested automatically - nothing to
  configure," which is stale. Replaced with the real manual, region-split,
  BetterStack-pull process from the runbook (4 steps), confirmed directly against
  the Back Office App's Ingestion > Stream > Configuration page (Services - OTel
  service.name tag list, Save configuration) - matches the runbook exactly. Added
  two new real screenshots: the `service.name` attribute in a BetterStack trace,
  and the Back Office Configuration section.
- `welcome` - `agents-cards.png` was the "CUSTOMER WEB APP · BASELINE"
  design-prototype tool (same root cause as #9 below/2026-08-18), showing
  fabricated dimension names (conversational/relevance/safety w/ decimal
  weights) that don't match the product's real dimension set. Replaced with a
  genuine capture of the live Agents cards view.
- `connect-your-agent` - `integrations-tab.png` was stale (old tenant selector,
  old key data) though the self-serve API-key prose was already confirmed
  accurate. Refreshed with a genuine capture (no tenant selector in the current
  single-tenant customer view).
- `scorecard` - `scorecard-tab.png` was still a Baseline prototype ("61/100,
  Needs work, 24 below," "pass bar and pass rate" language). Replaced with a
  genuine Score tab capture (100/100, Ship, dimension-weight breakdown) and
  corrected the alt/caption text to match what's actually shown.
- `scoring-over-time` - `activity-tab.png` was a Baseline prototype implying a
  Runs table with separate Change/Revision columns. Real Runs table columns are
  When/Trigger/Score/Scored/State (verdict is an inline badge next to Score,
  not its own column). Replaced screenshot and corrected the claim. Cadence
  (60 min minimum), lookback (1-90 days), and the Autonomous scoring toggle
  were all re-confirmed accurate live.
- `eval-catalog` / `custom-evals` - `catalog-door.png` / `entry-doors.png` were
  genuine captures but from a visibly older Back Office build (old nav, "Lior
  Nabat" login, different eval counts). Refreshed both against the current
  build (62 evals; "32 metrics · 3 templates" entry screen) - no prose changes
  needed, the "Create an eval" copy is verbatim identical live.
- Docs-site version bumped to `0.34.0` per user request, to track the
  AgentScore product version rather than the docs site's own semver.

**New finding, resolved as product-should-catch-up (no doc edit)**:
- `dimensions-and-profiles` - `profile-tab.png` is the same Baseline prototype
  tool as the items above (numeric "Fit score 0.82," an "Evidence diversity:
  4.2 distinct behavioural signatures" field, and a percentage weight bar with
  an "(excluded)" tag). Confirmed live on a real scored agent: the actual
  Profile tab has none of this - just a plain-language "Why this profile"
  paragraph and a simple table with integer `weight 1` values, no bar chart.
  Unlike the other Baseline-prototype cases above, **the user confirmed this
  richer version is the intended target design**, not a docs error - so the
  doc is left as-is (screenshot included) and this is logged purely as a
  product gap: the real Profile tab needs to grow a numeric fit score,
  evidence-diversity metric, and a weighted-bar dimension view to match what
  the docs already (correctly) describe.

**Resolved this pass (second round)** - docs edited, see CHANGELOG:
- `eval-catalog` (Library/G-Eval/Hybrid sections) and `custom-evals` ("Test
  before you trust it," "Nothing changes silently") - the "Live preview" panel
  question above is now resolved: **user direction is docs-should-update.**
  Checked three more surfaces looking for it (the Catalog card's detail modal,
  the "Run" button's destination, and a real agent's own Traces tab) and it
  exists nowhere as the inline docked score-gauge/PASS-FAIL/Agree-Disagree/
  version-diff experience the docs depicted. Trimmed both pages to match
  reality:
  - `eval-catalog` - dropped the Library section's screenshot entirely (no
    real capture exists of a Library eval's detail view - still needed, see
    below). Replaced the G-Eval and Hybrid screenshots with real detail-view
    captures (`studio-geval.png` now shows the "Template: Helpful, On-Point
    Answer" rubric + threshold; `studio-hybrid.png` now shows "Security
    Findings"'s real MAP/REDUCE breakdown) and rewrote the alt/caption text to
    describe what's actually shown - no more "live preview scoring 0.71" or
    "citing three grounded claims as evidence" language.
  - `custom-evals` - "Test before you trust it" now describes the real
    **Runner** tool (pick an eval, tenant, and agent; run against that agent's
    already-captured traces) with a genuine screenshot, replacing the
    fictitious inline trace-picker. "Nothing changes silently" was trimmed to
    just the confirmed-real fact (publishing creates a new immutable version;
    past grades stay attributed to their version) and dropped the
    diff-against-last-version / side-by-side score comparison / "what the
    judge saw" transparency-panel claims and screenshot, none of which exist
    today.
  - Deleted the now-unused `studio-library.png`, `studio-tracepicker.png`,
    and `studio-diff-transparency.png` asset files.

- `eval-catalog` - Library section now has a genuine capture too
  ("Template: Safe, Non-Toxic Output" derived from the `toxicity` library
  metric) after the browser session was relaunched.
- Added an explicit callout to both `eval-catalog` and `custom-evals` stating
  the catalog/builder/runner live in Agent Score's Back Office and are
  maintained by the Agent Score team, not a customer self-serve surface -
  the prior prose read as if the customer clicks through these themselves.

**Still open**:
- `custom-evals` - `guided-author.png` (the "Guided author" AI-assisted
  drafting flow, reachable via the "Start with AI" button on the "Create an
  eval" screen) was not run end-to-end this pass (time/API-call cost) -
  flagged for a follow-up verification, not yet trusted either way.

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

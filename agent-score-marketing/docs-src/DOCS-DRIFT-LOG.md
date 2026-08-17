# Docs ↔ Product Drift Log

Tracks every place the customer-facing docs (`src/content/*.tsx`) disagree with the
live product at `https://agent-score-customer.product.tricentis.com`.

**Direction of truth:** the **live product is authoritative for what is true today.**
Where a row is marked _product-should-catch-up_, the docs describe the intended
end-state and the gap is a product to-do, not a docs error. Where a row is marked
_docs-should-update_, the docs are simply stale and should be corrected.

Each audit appends a dated section. Newest first.

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

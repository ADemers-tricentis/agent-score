# AgentScore Beta: Metrics & Instrumentation

Draft answer to the open action item in [Path to Beta Release](https://tricentis.atlassian.net/wiki/x/swBN0w), Section 3 ("Andrew to define the exact data points/shape first, then Lior exposes them"). Grounded in the committed value metric and metering principles from the [Beta / Early-Access Commercial Model](https://tricentis.atlassian.net/wiki/pages/resumedraft.action?draftId=3561422894) doc.

Status: draft for review, not yet posted back to the wiki.

## Why these metrics

The commercial model doc locks two decisions this list has to serve:

- **Scoring run is the value metric, and is now also the sole billing unit** - not trace volume, not seats, and (per the latest decision) not LLM-call count or model tier either. Ingestion stays bundled/free by design. We may use a `credits = f(#LLM calls in the run, model tier)` formula floated in `docs/research/billing-model-research.md` - this will cause more complicated agents and more sophisticated models to cost the user more.
- **Credits-equivalent consumption is tracked but not billed** during the beta, to calibrate the eventual price. With the formula now anchored to run count rather than call/token volume, the open question narrows to *how* a run converts to credits (flat rate per run, or weighted by mode/dimension count) - not *whether* calls or model tier factor in, since they don't.

Token/LLM-call attribution at the **eval/dimension level** (per your earlier answer) is still worth collecting, but its purpose shifts: it's no longer an input to the customer-facing credit formula, since that formula only counts runs. It remains valuable for internal cost/margin visibility - i.e., knowing what a run actually costs Tricentis to serve (which judges ran, per-judge model tier) even though the customer is charged the same per-run regardless.

## Metrics to collect

| # | Metric | Grain | Why it matters | Collection method | Status |
|---|---|---|---|---|---|
| 1 | Scoring run count | per tenant, per period | The committed value metric, and now the literal billing unit - every credit charged maps back to a run, not to calls/tokens within it | Emit an event at scoring-run completion (`POST .../scoring/runs` completion, or the existing append-only `scoring-events` log) tagged `tenant_id`, `agent_id`, `run_id`, `mode`, `revision_label` | Partially exists - `scoring-events` audit log already logs run lifecycle events per the API reference; needs a tenant-period rollup |
| 2 | LLM calls per scoring run, by judge | per run, broken out by judge (Correctness / Quality / Security / Attribution) | No longer a credit-formula input (billing is per-run only) - kept for internal cost/margin visibility, since judge dispatch is conditional (Attribution only on non-PASS) so Tricentis's actual cost per run still varies even though the customer's charge doesn't | Extend `evalclaw.evaluator.llm_calls` (currently a session-level counter: 3 calls/PASS, 4/non-PASS) to carry a `judge` label and roll up per `run_id` | Needs new instrumentation - counter exists but not run-scoped or judge-labeled today |
| 3 | Token usage per eval/dimension | per run, per judge/dimension | Same as #2 - internal cost visibility at eval granularity per your answer, not a billing input | Extend `gen_ai.client.token.usage` histogram with `judge`/`dimension` and `run_id` labels at the point each judge call completes | Needs new instrumentation - currently session-level only |
| 4 | Model tier per judge call | per run, per judge | Same as #2/#3 - internal margin analysis (a Bedrock small model vs. a large Anthropic judge costs Tricentis differently even at a flat per-run price to the customer) | Tag the same LLM-call/token events with `provider` + `model` (already surfaced in R12's judge config: name, provider, model) | Needs new instrumentation - judge config exists, but isn't joined to usage events yet |
| 5 | Credits-equivalent consumption | per run, rolled up per tenant per period | The literal billed metric - a direct function of scoring-run count (flat-per-run or mode-weighted, TBD), not of metrics 2-4 | Computed metric: `credits = g(run count, mode/weighting TBD)`; store the weighting version alongside the computed value so historical runs stay interpretable if the weighting changes | Needs to be built - simpler than before since it rolls up from run count rather than call/token volume; exact weighting still open (see Open Questions) |
| 6 | Ingestion volume (spans/sec, storage bytes) | per tenant, per period | Quantifies the bundled cost being absorbed while ingestion stays free/unmetered | Ingest-service counters at the point spans land (cross-region trace fetcher, per Section 1 of the beta doc) tagged `tenant_id`, region | Not found in this checkout - likely exists or is planned in the private backend repo; needs confirmation from Lior |
| 7 | Scoring outcome distribution (PASS/PARTIAL/FAIL) | per tenant, per period | Not a cost metric, but needed alongside cost to read "cost per unit of value" rather than cost in isolation | Existing `evalclaw.eval.outcome` counter - just needs a tenant-period rollup | Exists |
| 8 | Session duration | per run/session | Secondary signal on run cost/complexity; useful for sanity-checking credit outliers | Existing `evalclaw.session.duration` histogram | Exists |
| 9 | Profile-fit confidence at scoring time | per run | Not billing-related, but flagged in the same standup as a potential future auto-notify trigger; worth capturing alongside run metadata now so it's not lost if the auto-notify question (Section "Open questions" on the beta page) gets picked up later | Tag onto the same run-completion event as metric 1 | Exists (confidence score is already computed per the beta doc) - just needs to be included in the run event payload |

## Rollup and join key

Every metric above should carry `tenant_id` as the primary join key, consistent with the existing API contract (`/admin/tenants/{tenant_id}/...`). Roll up to **per tenant per period** (period = week, to match the "weekly usage dashboard" ask) for the dashboard, but keep the underlying events at `run_id` grain so a specific run can be drilled into when a number looks wrong.

## Open questions

These are decisions or confirmations I can't make from the codebase or docs alone:


1. **Credit formula version.** `credits = f(#LLM calls, model tier)` is the directional formula from the billing research doc, but the exact weighting (e.g., credit cost per model tier, small-vs-large-run split a la Patronus) is explicitly "deferred to end of beta by design" per the commercial model doc. Do we instrument with a placeholder formula now (and accept it'll be recalculated retroactively from raw events), or wait for a first-draft formula before building metric 5?
2. **Retention/replay.** Since the credit formula will change post-beta, should raw per-eval token/call events be retained long enough to recompute credits-equivalent retroactively under a new formula, or is the beta-window rollup sufficient?

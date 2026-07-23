# Billing Model Research: AgentScore vs. Competing Products

**Source:** Live-fetched public pricing pages (langchain.com/pricing, langfuse.com/pricing, braintrust.dev/pricing, arize.com/pricing, galileo.ai/pricing, wandb.ai/site/pricing, helicone.ai/pricing, promptlayer.com/pricing, datadoghq.com/product/ai/llm-observability, honeycomb.io/pricing, patronus.ai/pricing, humanloop.com/pricing, snowflake.com) plus training-data knowledge for context.
**Date:** 2026-07-14
**Trigger:** Action item from the 2026-07-14 architecture/product planning sync (Leo + Product) - billing/credit model needed before Leo's onsite visit, week of 2026-07-27.

---

## 1. How competing products bill today

| Product | Core billing unit(s) | Evals billed separately? | Free tier | Notable quirks |
|---|---|---|---|---|
| **LangSmith** | Per-seat ($39/user/mo Plus) + trace overage ($2.50-5.00/1k traces) + new agent-runtime metering (per-run, uptime-min, LCUs, vCPU) | No - bundled into trace pool | Dev: 1 seat, 5k traces/mo, 14-day retention | Enterprise fully "contact us"; new runtime layer adds several metered dimensions |
| **Langfuse** | Consumption "units" = trace + observation (span) + score (eval), one pool | No - evals consume the same unit pool | Hobby: 50k units/mo, 2 users, no card | Graduated overage ($8→$6/100k as volume grows); startup/nonprofit discounts |
| **Braintrust** | Hybrid: GB processed + **"scores" (per 1k, i.e. eval runs)** + token credits for one feature | **Yes** - "scores" is a distinct metered line from data/GB | Starter: $10 credit, 1GB, 10k scores/mo | Unlimited seats on all tiers; scores overage $1.50-2.50/1k |
| **Arize AI (AX/Phoenix)** | Spans ingested + storage GB; no seats | No - "unlimited evaluations/experiments" included regardless of tier | Free: 25k spans/mo, 1GB, 15-day retention | Phoenix is free/open-source self-hosted; Enterprise contact-us |
| **Galileo** | Traces/month (tiered, not finely metered) | No - unlimited evals included in every tier | Free: 5k traces/mo, unlimited evals/users | No public overage rate; enterprise custom |
| **W&B Weave** | Data ingestion volume (GB/mo) | No - tracing, eval, and monitoring bundled into same ingestion metric | Free: 1 GB/mo | Overage $0.10/MB; volume discounts w/ annual commits |
| **Helicone** | Hybrid: per-request (post free tier) + GB storage + seats (Hobby only) | Not broken out - no distinct eval billing line found | Hobby: 10k req/mo, 1GB, 1 seat, 7-day retention | 50% off first year for startups; $100 OSS credit |
| **PromptLayer** | Hybrid: requests/mo + dedicated **"Eval Cell Execution"** allowance + per-transaction overage | **Yes** - "Eval Cell Executions" is its own metered quota separate from request logging | Free: 5 users, 2.5k requests/mo, 250 eval-cell executions | Overage $0.002-0.003/transaction; enterprise custom |
| **Datadog LLM Observability** | Per LLM-call span only (tool/agent/retrieval spans not counted) | No - an eval's own LLM call just counts as a span, no separate product fee | Free: 40k spans/mo, 15-day retention | Pro flat $160/mo incl. 100k spans; retention extensions billed per 10k spans separately |
| **Honeycomb** | Events ingested + metrics data points/mo; seats/queries unlimited | N/A - no distinct AI/LLM eval product; folded into standard events pricing | Free: 20M events/mo + 100M metric points | Enterprise requires 10B events/year minimum commit; no LLM-judge product |
| **Patronus AI** | Subscription ($25/mo base) + per-eval-call credits: $10/1k "small" evals, $20/1k "large" evals, $10/1k explanations | **Yes** - eval-run IS the core priced unit (eval-only platform, no general trace ingestion product) | Free: $10 credit, 2 projects, 5 experiments/project | Enterprise fully contact-us; unusual "eval size" tiering |
| **Humanloop** | Logs/month + separate **"eval runs"** quota | **Yes** - eval runs is a distinct line item from raw logs | Free: 2 members, 50 eval runs, 10k logs/mo | Public site shows only Free/Enterprise now; soft overage (upsell, not cutoff) |
| **TruEra (→Snowflake Cortex AI Observability)** | Defunct as standalone (acquired by Snowflake, May 2024; GA July 2025) - billed via Snowflake's per-token AI Credits + warehouse compute | N/A - runs as Cortex AI Functions | No dedicated free tier; standard Snowflake trial credits only | No separate eval-specific rate card; pure consumption/credits |

---

## 2. Market patterns

- **Ingestion volume is the dominant primary meter.** Most observability-first tools (Langfuse, Arize, Weave, Datadog, Honeycomb, Galileo) charge on trace/span/event/GB volume, not tokens or seats, and bundle evaluation runs into that same pool "for free."
- **Eval-first/dedicated eval platforms break out a separate unit.** Braintrust ("scores"), PromptLayer ("eval cell executions"), Humanloop ("eval runs"), and pure-play Patronus AI (evals ARE the product) all meter LLM-judge/scoring runs distinctly from raw ingestion, usually at a materially higher per-unit rate than plain logging.
- **Per-seat pricing is fading as a primary axis.** Only LangSmith still leads with per-seat + usage; most others (Braintrust, Arize, Langfuse Pro+) explicitly advertise unlimited seats and monetize purely on data/eval volume.
- **Enterprise tiers are almost universally "contact sales"** with no public numbers - true across nearly all 13 vendors; only Datadog, Langfuse, and Braintrust publish a mid-tier flat/starting price above their free plan.

---

## 3. Recommendation for AgentScore

AgentScore's cost driver is not raw trace ingestion - it's the **scoring run** (a single run can fan out to ~10 LLM calls). That maps directly to the eval-first precedent (Braintrust / PromptLayer / Patronus), not the observability-first precedent (Langfuse / Arize / Datadog), where evals ride free on top of ingestion.

1. **Bundle/give away trace ingestion.** Since onboarding is via the OTel exporter (no proprietary SDK, per constraint C1), there's no reason to meter the on-ramp - make ingestion generous or free, matching Arize/Galileo/Datadog's approach of not gating on trace volume.
2. **Meter scoring runs as the core paid unit, denominated in credits rather than a flat per-run price**, since run size/cost varies with number of LLM calls and model tier. This mirrors Patronus's small/large-eval split and Braintrust's "scores" unit, and matches the "credit base" model Leo raised in the 2026-07-14 sync.
3. **Unlimited seats.** Nobody in this market charges per-seat anymore except LangSmith, and it doesn't map to AgentScore's usage pattern (agent teams, not individual query volume).
4. **Free tier gated on scoring-run volume, not trace volume** (e.g., N free scoring runs/month). Lets prospects pipe in unlimited traces and only pay once they're running evals at volume - also simplifies the later AI Workplace bundling story.

This gives engineering (Leo) a clean design target: **credits consumed = f(# LLM calls in the run, model tier)**, independent of trace ingestion volume.

**Open question / not yet decided:** exact credit-to-dollar conversion, volume discount curve, and whether "small" vs "large" scoring runs (per Patronus's eval-size split) should be a distinct pricing dimension for AgentScore given its multi-dimensional scoring model (6 core + 5 extended dimensions per eval, per `docs/AgentScore-PRD.md`).

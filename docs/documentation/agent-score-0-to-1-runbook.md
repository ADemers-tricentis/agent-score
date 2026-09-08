# Runbook: Agent Score, Zero to One

**Audience:** new Agent Score team members — engineers, PMs, or anyone who needs the full picture of how a customer goes from "doesn't exist in the system" to "has a score," including everything the back office does along the way that a customer never sees.

**Status:** current-state, grounded in the product source (`Tricentis-AI/agent-score` @ `main`, `v0.38.5` as of 2026-08-27/28, spot-checked live again 2026-09-08 — see inline "as of" dates below for what's been re-verified since). **Companions:** [14-scoring-engine-reference.md](14-scoring-engine-reference.md) (the scoring pipeline in full technical depth — this doc summarizes and cross-links it rather than repeating it), the customer-facing docs at `agent-score-marketing/docs-src/` (what a customer reads — this doc is the back-office-inclusive version of the same journey). The former internal-agent-onboarding-runbook.md companion has been folded into §3.2 below and retired as a separate file.

> **A note on staleness:** this product ships fast — several facts in this doc (verdict-label wording, tenant counts, exact profile names) were true as of the versions/dates above and may already have drifted by the time you read this. Where something surprised us or contradicted an older internal doc, it's called out explicitly. If in doubt, the live back office is the source of truth, not this file.

---

## 1. The one-paragraph mental model

Agent Score never talks to your agent. It only reads the OpenTelemetry traces your agent already produces, groups them under an **agent** (auto-identified from trace content, not registered by hand), waits until it has enough evidence to know what *kind* of agent it's looking at, grades a sample of its conversations against a bundle of quality checks called a **profile**, and rolls that into a single 0-100 **composite score** with a plain-language verdict. Everything below is either "how traces get from the agent to us" (ingestion) or "how we turn traces into a score" (scoring) — plus the back-office surfaces a Tricentis operator uses to run the whole thing.

---

## 2. Architecture at a glance

Two independently-deployable FastAPI services share one Postgres, via a common Python package (`packages/common/`):

- **Ingest** — OTel receivers only. An authenticated (`tk_...` key) external endpoint for customer traffic, and a VPN-gated internal endpoint for Tricentis-internal services.
- **Platform** — the back-office API, the (not-yet-built) customer Client Read API, and scoring control-plane.
- **Scoring worker(s)** — a separately-scaled pool that claims jobs off a Postgres queue.

Storage is two systems, both ours (no vendor): an S3-protocol **object store** holds raw trace payloads (one object per trace), and **our Postgres** holds the trace index plus everything else (tenants, agents, scoring results). This replaced Langfuse in full on 2026-08-24 — if you find an older doc that still says "Langfuse," that's the thing it's describing (see §9).

A trace's path: OTel spans → an in-memory assembly window → identity/agent resolution → payload written to the object store, then an index row written (payload-then-index, write-once) → later, a scoring run reads it, grades it against every enabled eval in the agent's adopted profile, and rolls the results into a composite.

The frontend is one Vite codebase with two builds — back office and customer — served from the same process and selected by request `Host`.

---

## 3. The lifecycle, step by step

### 3.1 A tenant has to exist first

A **tenant** is "one per customer × environment" — it groups agents for billing, identity, and scoring. **There is no self-serve tenant creation today.** An operator creates one from the back office (**Tenants → + New tenant**, `/tenants/new`):

- **Name** — convention `<customer>-<env>`, immutable once set, used in URLs.
- **Kind** — `External` (customer-owned; gets a tenant API key on create) or `Internal` (Tricentis-internal; no tenant API key).
- **Environment** / **Region** — free-form grouping metadata (`prod`/`staging`/`dev`, `eu-west-1`, etc.), not auth-relevant.
- **Metadata (JSON, optional)** — free-form, searchable/filterable in the back office (e.g. `{"contract_tier": "enterprise", "csm": "..."}`).

The one exception: an agent built in **AI Workspace** auto-creates its tenant the moment its first trace arrives — the AI Workspace tenant name passes through as-is, nothing to provision by hand.

### 3.2 Getting traces flowing — two paths

**Path A: built in AI Workspace.** Fully automatic. Agents here run under `relic-service`; traces (and tenant creation, per above) just start flowing once the agent runs, with no ingest key, no registration step, and session IDs captured automatically. This is the only path with zero setup.

**Path B: everything else, via an OTel exporter.** Every other agent — external customer or Tricentis-internal — reaches Agent Score as OpenTelemetry traces pointed at an ingest endpoint, authenticated with a tenant's ingest key (`tk_...`, one per tenant, created/rotated/revoked independently from **Integrations** in either app). Two env vars, in most cases just added to an exporter you already have:

```
OTEL_EXPORTER_OTLP_TRACES_ENDPOINT=<ingest endpoint>/external/otel/v1/traces
OTEL_EXPORTER_OTLP_TRACES_HEADERS=Authorization=Bearer <tk_... ingest key>
```

Use the `_TRACES_`-suffixed vars specifically — the unsuffixed form is a base most exporters would append `/v1/traces` to on their own, double-appending the path. The customer app's **Agents → + Add agent → Connect an agent** wizard does this end-to-end for you: pick the tenant, it shows you that tenant's key, and hands you the exact pair above, pre-filled.

Path B has one internal variant worth knowing: for a Tricentis-internal service, whether it can push OTel data to us directly depends on AWS region, not on the service itself — Agent Score's account can only be network-peered to one AWS region at a time. In US-East, an SRE-built collector forwards those services' traces to us directly (live push). Everywhere else (EU, APAC, ...), no direct connection is possible, so Agent Score instead **pulls from BetterStack's API** on a schedule and replays those same spans into its own internal ingest endpoint. This is a stopgap until per-region Agent Score deployments exist.

An operator sets this up from the back office rather than the service's own team touching any exporter config. Step by step, confirmed live 2026-09-08:

1. **Identify the service name.** Find the exact service/container name the target agent's deployment reports in its traces — usually the deployment/container name, not the agent's own name. Look it up in [Better Stack](https://telemetry.betterstack.com/team/t326687/services) (Sources > Services > Env > Region > Service), or ask the engineers who built the service what it sends as `service.name` — don't guess.
2. **Register it under Ingestion → Stream** (`/admin/ingestion?tab=stream`, **Configuration** panel — Sources, **Services — OTel service.name**, poll interval 5-3600s, read lag 0-900s), then **Save configuration**. As of 2026-09-08 the known/registered services included `apt-assistant-agent`, `autonomous-service`, `chatbot-agent-service`, `performance-agent`, `quality-agent`, `quality-agent-worker`, `relic-service`, and `Tricentis.AI.API.Gateway.Service` — treat that list as a snapshot, not something to assume is current.
3. **Confirm it's being pulled.** Give it a pull cycle, then check traces are arriving (the Stream tab's Counters and per-source Sources table show captured/lost/confirmed/throughput). A **Reset stream state** control exists here too (added since 08-27) for clearing a stuck stream.
4. **Check the resolved agent(s)** under **Agents** in the back office — they land grouped under the service the same way any other multi-agent service does. Confirm the name(s) match what you expect.
5. **If nothing resolves / the wrong thing resolves,** the service isn't emitting an identifiable agent-name signal Agent Score recognizes — go back to its engineers and confirm the exact name/field, then adjust.

As of 2026-09-08, the ingest service's scale refactor (mentioned as "in progress" as recently as 08-26) has substantially landed: receipt memory is bounded with backpressure instead of growing unbounded, traces are read/assembled span-by-span instead of holding a whole trace in memory, a single bad span no longer destroys the trace it's in, and a truncated capture (missing root span) now resolves on its own grace period instead of sitting unscored for up to 24 hours. Session-based scoring, by contrast, is still unresolved — session IDs are captured automatically, but no session-aggregation scoring decision has landed; don't build against it yet.

The **Ingestion** page's other tabs (Overview / Internal / External / Stream / Metrics / Alerts / Activity) are where you watch pipeline health for both paths — capture rate, error rate, buffer occupancy, and a gap log when spans are permanently lost (retention expiry, buffer overflow, a malformed row).

Under either path, one **service** (the deployment/container name) can resolve to several distinct **agents** underneath it, derived from whatever agent-run signal shows up in its traces — e.g. `relic-service` fans out into many AI Workspace agents.

### 3.3 An agent is born already scoreable — just not usefully

The moment a tenant's key (or the internal pipeline) forwards a trace for a never-seen agent, a provisioning step runs that creates the `Agent` row and, **in the same transaction**, binds it to the **Default** profile — a literal placeholder with 0 evals and no dimension weights. This guarantees no agent is ever "unscoreable," but Default itself produces nothing worth looking at. You'll see agents sitting here in the back office's **Agents** list with a Profile/Fit column reading something like `Default — not scored yet`.

### 3.4 Evidence accumulates, then a profile actually gets picked

Once **20 traces** have arrived, a scoring-worker "fit" job looks at the agent's hydrated traces — its toolset, model, naming patterns, the shape and timing of its calls — and adopts whichever catalog profile fits best, *if* it's confident enough (an `evidence diversity` score has to cross a threshold). Until then, the agent sits on the fallback profile (see below). This is genuinely automatic; there is no human "calibration session" gating a profile choice, despite what an older aspirational doc (`agent-score-flow.md`, §9 below) describes.

**The profile catalog was rebuilt on 2026-09-08** (PR #598) and the list below is now stale — the "9 profiles" and Starter-family names (`RAG Starter`, `Computer-use Starter`, `Conversational Starter`, Tool-Orchestrator, Code, Structured-Generation) confirmed live on 08-27 **no longer exist**. The catalog now holds **7 profiles**, seeded from what real corpora demonstrated rather than a fixed pre-set list, confirmed live across 9+ agents on 09-08: `Grounded Answerer`, `Summarizer`, `Tool Caller`, `Task Agent`, `Conversational Assistant`, `Policy Guardrail`, and `General Answerer` (the fallback — internal id `general-starter`, still the same 4-dimension shape: Correctness, Relevance, Safety, Quality/Efficiency, just renamed for display). Whether `Default` (the zero-eval placeholder bound at agent creation, §3.3) survived this rebuild wasn't re-verified — check **Catalog → Profiles** for the current list, since this is exactly the kind of thing that keeps changing. Each profile version is **immutable** — editing creates a new version; an already-adopted agent stays pinned to its version until it explicitly re-adopts.

### 3.5 Calibration and goldens — a separate, optional track

This is *not* a gate on getting a first score. Reference-free evals (faithfulness, tool-correctness, safety) score from the very first run. But reference-based evals (answer-correctness, JSON conformance) need a human-confirmed expected answer, called a **golden**. Once ≥20 interactions exist, a **Labeling queue** (back office, agent detail → **Labeling** tab) offers a representative sample plus the judge's proposed verdict; an operator confirms or overrides it (with a corrected verdict, expected output, and a note). Confirmed items are append-only and unlock both reference-based evals and a fixed-input "Production mode" run, which is what makes a run-over-run delta trustworthy rather than confounded by a changing sample.

### 3.6 Scoring: the mechanical core

A run is never an in-process call. A **producer** enqueues one `ScoringRun` row plus N `ScoringTask` rows in Postgres; any number of **workers** claim tasks (`SELECT ... FOR UPDATE SKIP LOCKED`, so no two workers grab the same one), hydrate + canonicalize + grade every enabled eval for their task, and UPSERT terminal results (safe to retry, never double-counted). Once every task for a run is terminal, one worker is elected to aggregate and finalize. A background reaper requeues anything a crashed worker abandoned.

Each eval is one of four **kinds**:

| Kind | Mechanism | Deterministic? |
|---|---|---|
| Library | a pre-built metric (e.g. Faithfulness, Hallucination) | per-metric |
| G-Eval | plain-English criteria, graded by an LLM judge | no (judge variance) |
| DAG | a fixed yes/no decision tree | yes |
| Hybrid | LLM extracts structured claims (MAP), code scores them (REDUCE) | REDUCE step is |

A missing required input produces **N/A**, never a zero — the composite only ever reflects what was actually measured. Scores aggregate bottom-up: eval means → dimension score (weighted, renormalized over whatever qualified) → composite (same renormalization one level up). Anything below a minimum sample floor is **excluded, never zeroed**.

### 3.7 Verdict bands — and a live wording nuance worth knowing

| Composite | Verdict (confirmed live, 2026-08-27) | Verdict (Profile tab "bar" table, confirmed live 2026-09-08) | Older/reference-doc wording |
|---|---|---|---|
| 85-100 | Ship | Ship | Ship |
| 70-84 | Ship with note | Ship with note | Ship (with note) |
| 55-69 | **Needs work** | **Review required** | Review required / Review |
| 40-54 | **Don't ship (recommended)** | **Block recommended** | Block recommended |
| 0-39 | Block *(unconfirmed live — no sub-40 example seen)* | Block | Block |

As of 2026-09-08 the product disagrees with itself on the middle two labels. Every agent's **Profile tab** now has a formal verdict-band table ("The bar," `/tenants/.../agents/...` → Profile) that shows **"Review required"** and **"Block recommended"** — which happen to match the doc's "older/reference-doc wording" column. But the **Score tab** badge/copy and the **back-office Home** worklist ("agents needing attention") both still show **"Needs work"** and **"Don't ship"/"Don't ship (recommended)"** — the same wording confirmed live on 08-27. So the "older" wording wasn't fully retired, it just moved to a different surface than we thought last time. This doesn't look intentional (a rename that landed on one surface and not the others is more likely than two deliberately-different vocabularies for the same bands) — flag it if you're touching verdict-label logic, and don't assume either column is "the" current truth without checking both surfaces.

One thing we still can't reconcile: `14-scoring-engine-reference.md` describes a collapsed **3-state `ship_decision`** field where `review` and `block_rec` both map to a single `needs_work` bucket — but live, a 40-54 score has always shown a *distinct* label from the 55-69 band (whichever wording pair a given surface uses), never collapsing the two. Best current guess: the 5-tier `verdict` field is what's user-facing and got partially relabeled without changing the separate internal `ship_decision` collapse, but this wasn't verified against code.

Every score carries a **95% confidence interval** (conservative Bernoulli bound, narrows as more interactions get scored), and the Score tab shows this as a plain-language prediction ("Score another sample and you'd likely get 66-80") plus a callout when you're close to the next band's boundary.

### 3.8 It doesn't stop at the first run

Each agent has an **Autonomous scoring** toggle (Profile tab) with a cadence (60 min minimum) and lookback window (1-90 days), inheriting tenant defaults unless overridden. Every run, profile change, and schedule update lands in a single **Activity** timeline. A new run's delta against baseline is shown as **exact** when nothing structural changed, **approximate** (with reasons listed) when the eval set, golden set, scored-count, or profile changed, and **refused entirely** only across incompatible modes (e.g. comparing live Production traffic to a Sandbox run).

---

## 4. Back-office tour

Logged in as a superadmin at `https://agent-score.product.tricentis.com` (a separate app/login from the customer-facing `agent-score-customer.product.tricentis.com` — same account, different sign-in). Sidebar, top to bottom:

- **Home** (`/`) — product-wide stats: tenants, active agents, 24h trace volume, 24h scoring runs by verdict bucket, and an "agents needing attention" worklist (latest run was Review or Block, worst first).
- **Agents** (`/agents`) — cross-tenant flat list, **53 agents as of 2026-09-08** (was 293 as of 08-27/28 — a large drop; cause not investigated, flag if you see something similar and it looks wrong rather than assuming it's expected). Each row: tenant, trace count, last-active, pipeline stage (`Up to date` / `Collecting trace...`), score, verdict, and adopted profile/fit state. Click into one for **Score / Agent Card / Traces / Profile / Labeling / Settings** tabs.
- **Catalog** (`/evals/catalog/...`) — three tabs: **Evals** (62 as of 08-27/28, not re-checked 09-08 — Library/G-Eval/DAG/Hybrid, filterable by kind/status/dimension), **Dimensions**, **Profiles** (**7 as of 2026-09-08**, was 9 — see §3.4, catalog was rebuilt).
- **Builder** (`/evals/builder`) — "Create an eval": describe it in plain language and let the tool recommend an approach, or browse the catalog/templates directly. Both paths land in a Studio for testing and versioning.
- **Runner** — test any eval against real captured traces for a chosen tenant/agent before trusting it in production.
- **Tenants** (`/tenants`) — list + **+ New tenant** (§3.1).
- **Users** — staff account management (kind / superadmin flag).
- **Agent Registry** (`/agent-registry`, new since 08-27/28) — **not** the customer/internal agents Agent Score scores. This is the registry of Agent Score's *own* internal AI task slots that power the product: `agent_card` (writes the Agent Card summary), `chat_assistant` (a back-office-only conversational assistant — distinct from the still-unlaunched customer-facing "ask about your scores" chat, see the updates changelog's Coming Next), `improvement_advisor` (turns a scoring run's verdict into recommendations — backend/API only as of 09-08, no customer surface yet), `profile_fit` (the §3.4 fit job), and `scoring_judge`. Each slot shows its bound model version and tool count. Has an **Agent runs** tab alongside **Registry**.
- **LLM Catalog** (`/llm-catalog`) — "named, reusable LLM inferences used to score benchmarks," superadmin-managed. Tabs: **Catalog** (7 inferences as of 08-27/28, not re-checked 09-08, all routed through Amazon Bedrock — e.g. `Claude Opus 4.8`, `GPT-5.6 Sol`), **Usage log**, **Pricing** (effective-dated, including cache read/write rates), **Routing** (per-task judge assignment).
- **Ingestion** (`/admin/ingestion`) — see §3.2. Superadmin-only. Tabs: Overview / Internal / External / Stream / Metrics / Alerts / Activity.
- **Scoring Pipeline** — run dispatch / queue operational view.
- **Simulation** — replay synthetic traces, useful for testing without waiting on real traffic.
- **Reports** (`/reports?tab=usage`) — cross-tenant usage and spend over a chosen window (30d default). Columns include active agents, traces, evaluation results, profile fits, agent cards, and a cost breakdown (Scoring / Profile fit / Agent card / Other) with per-unit averages. Has an Export to Excel button.
- **Debug Logs** — raw operational log tail.

---

## 5. What's real vs. what's aspirational

It's easy to find older docs in this repo (and in the product repo) describing a more elaborate journey than what's actually built. As of this writing:

**Built and live:** everything in §3 above — tenant/agent provisioning, both ingestion paths, auto-fit profile adoption, the eval catalog (all 4 kinds), the Labeling/goldens queue, the Postgres-queue scoring worker and aggregation math, per-agent scheduling, the LLM/judge catalog with pricing, the usage/spend report, trace replay/simulation, and the customer-facing Score/Agent Card/Profile/Activity tabs plus the in-app "Connect an agent" wizard.

**Not built — don't describe these as real:** a CI/CD PR-gate check, an AI Workspace deployment-gate modal, environment-tagged (`pr-{id}`/staging/production) monitoring separation, a Tosca `AgentScoreCheck` integration, and the customer-facing `ck_` Client Read API / Python SDK (reserved, not implemented). `docs/PRODUCT.md` and `docs/agent-score-flow.md` in the product repo describe this fuller vision (including a human "calibration session" and a value-anchor/expected-net-value model) — both are explicitly marked as the target state or retired, not what exists today.

---

## 6. Things that trip people up

- **Two separate apps, one account.** Back office (`agent-score.product.tricentis.com`) and customer app (`agent-score-customer.product.tricentis.com`) are different logins, different route trees, same underlying data.
- **The customer-facing docs site has forked.** `agent-score-marketing/docs-src/` (this repo) was ported, one-time, into the product repo's own customer-app `/docs` route as independent hand-edited source — per the porting PR, "not an ongoing sync." Both are live simultaneously today and can drift apart; don't assume an edit in one shows up in the other.
- **"Langfuse" in older docs means the old trace store.** The Postgres+S3 migration (2026-08-24) replaced it fully; if a doc says Langfuse, treat that specific claim as historical unless it's dated after 08-24.
- **A fresh agent-detail page sometimes shows "Something went wrong."** A reload usually fixes it — a known rendering quirk, not a data problem.
- **Verdict-label wording is actively in flux, and as of 09-08 inconsistent within the product itself** — see §3.7. Don't hardcode label strings from memory; check both the live Score tab *and* the Profile tab's bar table, since they currently disagree.
- **The profile catalog gets rebuilt, not just extended** — see §3.4. The entire named-profile list from 08-27/28 was replaced wholesale on 09-08, not appended to. Don't hardcode profile names either.

---

## 7. Key source files, if you need to go deeper

| Concern | File |
|---|---|
| Full scoring pipeline, math, and provenance guarantees | `docs/documentation/14-scoring-engine-reference.md` (this repo) |
| Internal (non-AI-Workspace) agent onboarding, step by step | §3.2 above (folded in from the retired internal-agent-onboarding-runbook.md) |
| Aggregation math (pure, no I/O) | `services/platform/src/agent_score_platform/scoring/aggregate.py` (product repo) |
| Run dispatch / queue / worker | `services/platform/src/agent_score_platform/scoring/{runner,queue,worker,producer}.py` (product repo) |
| Canonical trace projection | `packages/common/src/agent_score_common/trace_store/canonical.py` (product repo) |
| Back-office frontend routes | `frontend/src/back-office/` (product repo) |
| Product vision (partly aspirational — read with §5 in mind) | `docs/PRODUCT.md`, `docs/agent-score-flow.md` (product repo) |

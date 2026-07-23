# Getting Started: Your First Agent

This guide takes you from a blank Agent Score instance to your first composite score in ~15 minutes (reference-free metrics only; add ~30 minutes if you want the `correctness` metric with labeled goldens).

**Audience:** Operators with back-office access (superadmin or tenant-admin role).

---

## What you'll do

```
[Configure judge] → Create tenant → Create agent → Copy API key
       → Instrument agent → Configure benchmark → Run scoring → Read results
```

Steps 0 and 3 apply only to **external** agents (`kind = external`). Internal (AIWS) agents skip judge configuration and API key copying.

---

## Prerequisites

- Back-office running at `http://localhost:5173` (or the AWS URL for prod).
- Superadmin access (needed to create tenants and manage judges).

---

## Step 0 (optional): Configure a judge LLM

> Skip if a default judge already exists. Check **Settings → Judges**.

The judge is the LLM that reads your agent's interactions and scores them. Agent Score proxies the call — model costs appear on your provider account.

1. Go to **Settings → Judges → Add judge**.
2. Fill in:
    - **Name** — human label (e.g. `claude-opus-4-default`).
    - **Provider** — `anthropic`, `openai`, `azure`, or `bedrock`.
    - **Model ID** — e.g. `claude-opus-4-8`.
    - **API key** — encrypted at rest; never returned after save.
3. Check **Set as default**. At most one judge can be default.
4. Save.

---

## Step 1: Create a tenant

A **tenant** maps 1:1 to a customer environment (e.g. `acme-prod`, `acme-staging`). Each tenant gets its own isolated Langfuse organization.

1. Go to **Tenants → New Tenant**.
2. Fill in:
    - **Name** — lowercase slug, 3–60 chars, unique (e.g. `acme`). **Immutable after creation.**
    - **Kind** — `external` for customer-managed agents; `internal` for AIWS agents.
    - **Env** — environment label, e.g. `prod` or `staging`.
    - **Region** — free-form (e.g. `us-east-1`).
    - **Metadata** — optional JSON for custom attributes.
3. Submit. Agent Score creates a Langfuse organization in the background.

> Create separate tenants per customer × environment (`acme-prod`, `acme-staging`) — not one tenant with an env flag.

---

## Step 2: Create an agent

An **agent** is the scoring unit — it maps 1:1 to a Langfuse project and represents one AI system or variant being evaluated.

1. From the tenant detail page, go to **Agents → New Agent**.
2. Fill in:
    - **Name** — lowercase slug, 1–63 chars, unique within the tenant. **Immutable after creation** — changing it breaks AIWS routing and splits Langfuse history.
    - **Kind** — must match the parent tenant's kind (`external` or `internal`).
    - If `kind = internal`: also enter **AIWS Tenant Name** and **AIWS Env** (routes spans from AI Workspace automatically).
3. Submit. Provisioning runs four steps in order:
    1. Inserts an agent row (status: `provisioning`).
    2. Creates a Langfuse project.
    3. Mints a Langfuse project API key pair; encrypts the secret at rest.
    4. Sets status to `active`.

If provisioning fails (Langfuse unreachable, network issue), the row shows `failed` with a reason. Use **Retry** on the agent detail page — the saga is idempotent.

---

## Step 3: Copy the API key (external agents only)

> Internal (`kind = internal`) agents skip this — they authenticate via AIWS HMAC routing.

When provisioning completes, the response includes a one-time **external secret key** (`sk_...`). This is the credential the agent sends to the Ingest endpoint.

**Copy it now.** It is shown exactly once and cannot be recovered — only rotated.

Store it in your customer's secret manager. The back-office display shows only the last 4 characters (`sk_...xyz9`).

To create additional keys (e.g. per environment): **Agent → API Keys → Add key**. To revoke: toggle **Disable** next to the key.

---

## Step 4: Instrument the agent

Point the agent's OpenTelemetry exporter at the Agent Score ingest endpoint using the key from Step 3.

**Endpoint:**

```
http://<ingest-host>:8001/v1/traces
```

**Required header:**

```
Authorization: Bearer sk_...
```

**Python example (OTel SDK):**

```python
from opentelemetry import trace
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from opentelemetry.exporter.otlp.proto.http.trace_exporter import OTLPSpanExporter

exporter = OTLPSpanExporter(
    endpoint="http://<ingest-host>:8001/v1/traces",
    headers={"Authorization": "Bearer sk_..."},
)
provider = TracerProvider()
provider.add_span_processor(BatchSpanProcessor(exporter))
trace.set_tracer_provider(provider)
```

Ingest resolves the key to an agent, decrypts the agent's Langfuse credentials, and forwards the OTLP payload to Langfuse under the agent's project. Spans land in Langfuse exactly as sent — no re-tagging.

Collect **at least 10–20 real interactions** before proceeding. The Agent Overview page shows a readiness indicator.

---

## Step 5: Configure the benchmark

A **benchmark** defines what "good" means for this agent: which metrics to run, at what thresholds, with what weights. A default benchmark is created automatically.

Go to **Agent → Scoring → Benchmark config**.

### 5a. Choose metrics

|Metric|Type|Needs labels?|What it checks|
|---|---|---|---|
|`faithfulness`|Reference-free|No|Is the output grounded in the context provided?|
|`answer_relevancy`|Reference-free|No|Does the output directly address the input?|
|`tool_correctness`|Reference-free|No|Did the agent invoke the right tools with the right arguments?|
|`correctness`|Reference-based|**Yes**|Does the output match a known-good answer?|

Start with reference-free metrics — they run immediately, no labels required. Enable `correctness` only after Step 5b.

### 5b. Label interactions (reference-based metrics only)

> Skip for a first run; come back when you want `correctness`.

1. Go to **Agent → Scoring → Calibration**.
2. The system surfaces 10–20 sampled interactions.
3. For each: review the agent's output; confirm or correct the AI-assisted verdict; optionally enter the expected output.
4. Confirmed interactions become **goldens** — the labeled dataset `correctness` evaluates against.
5. Once you have ≥ `min_sample_for_verdict` goldens (default: 10), enable `correctness` in the benchmark config.

### 5c. Set thresholds and weights

- **Per-metric threshold** (0–1) — interactions below this fail the metric. Start with `0.7`.
- **Per-metric weight** — contribution to the Benchmark dimension. Equal weights are a safe starting point.
- **Sample size cap** — maximum interactions per run (default: 50). Lower for faster/cheaper tuning runs.
- **Verdict bands** — composite thresholds for Ship / Ship with note / Review / Block (defaults from [PRODUCT.md](https://file+.vscode-resource.vscode-cdn.net/Users/a.demers/dev/Tricentis/agent-score/docs/PRODUCT.md)).
- **Judge** — leave as default unless you need a per-metric override.

Save. The `config_version` bumps on every save and is snapshotted into every run for reproducibility.

---

## Step 6: Trigger a scoring run

1. Go to **Agent → Scoring → Run now**.
2. Fill in:
    - **Revision label** — the version being evaluated (e.g. `v1.2.0`, `main`, `pr-42`).
    - **Mode**:
        - `population` — score a random sample of recent interactions.
        - `golden_match` — score only interactions that match goldens (useful with `correctness`).
        - `golden_ci` — CI mode; scores the full golden set deterministically.
3. Submit. The run enters `queued → running`.

The engine: pulls traces from Langfuse → invokes the judge LLM per metric per interaction → writes scores back to Langfuse (idempotent) → aggregates into a composite 0–100 → writes the final `ScoringRun` row.

Only one active run per `(agent, mode)` at a time. A second submission queues it.

---

## Step 7: Read the results

When the run reaches `complete` (or `partial` if some interactions failed to score):

|Field|Where|What it means|
|---|---|---|
|**Composite score**|Agent Overview gauge|0–100; weighted Benchmark (50%) + Value-Efficiency (30%) + UX Signal (20%)|
|**Benchmark score**|Scoring → Run detail|The LLM-as-judge dimension|
|**Verdict**|Prominent badge|Ship / Ship with note / Review / Block recommended / Block|
|**Delta vs baseline**|Run detail|Points moved from baseline; positive is better|
|**Metric breakdown**|Run detail table|Per-metric mean score, pass rate, failure count|
|**Per-interaction scores**|Langfuse trace view|Each trace has scores attached with judge reasoning|

The first run becomes the baseline automatically. To promote a later run as the new baseline (e.g. after a successful release), use **Set as baseline** on the run detail page.

---

## Troubleshooting

|Symptom|Likely cause|Fix|
|---|---|---|
|Agent stuck on `provisioning`|Langfuse unreachable during create|Check Langfuse health; use **Retry** on agent detail|
|Ingest returns 401|Wrong or revoked API key|Verify in **Agent → API Keys**; rotate if needed|
|Run stuck on `queued`|No judge configured or judge key invalid|Check **Settings → Judges → default**|
|Run `failed`|Judge LLM error or traces unavailable|Check run detail for `failure_reason`; inspect Langfuse for traces|
|Scores not in Langfuse|Scoring wrote them but Langfuse UI is slow|Wait ~30s; scores are written via `create_score()` after each interaction|
|`insufficient_sample` verdict|Fewer than `min_sample_for_verdict` interactions scored|Lower the threshold or collect more traces|

---

## What's next

- **CI/CD integration** — trigger a `golden_ci` run on every PR via the platform REST API; fail the check when verdict is `block` or `block_rec`.
- **AI Workspace gate** — for `kind = internal` agents, AIWS calls the gate endpoint before each deployment; a blocking verdict stops the rollout.
- **Multiple environments** — create separate agents for `prod` and `staging` tenants; compare runs across environments.
- **Metric tuning** — after a few runs, review per-metric breakdown; disable metrics not meaningful for your agent's domain, or add a custom rubric via `correctness` with tailored goldens.
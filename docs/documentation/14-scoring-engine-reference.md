# Agent Score — Scoring Engine Reference

**Status:** current-state technical reference, grounded in code · **Companions:** [06-agent-scoring-flows.md](06-agent-scoring-flows.md) (dated pre-spec discovery doc — flows/journeys, not implementation), 13-user-guide.md (user-facing surface), 00-design-decisions.md (ADD-030/031/089/091/122 are the load-bearing decisions this doc narrates), 01-architecture.md §3.8

> Agent Score never executes the agent it scores — it only reads traces the agent already sent (OTLP → Langfuse). A **Scoring Run** turns a set of traces into per-eval scores, rolls them into a **composite 0–100**, and maps that to a **ship/hold verdict** with a delta against a baseline. This doc walks the full pipeline as it is actually implemented today (`services/platform/src/agent_score_platform/scoring/`), not the target state.
>
> Diagrams render natively on GitHub (Mermaid). If you're viewing this in a plain-text editor, open it in a Mermaid-aware viewer (GitHub, VS Code preview, `mermaid.live`) to see them rendered.
>
> **In plain terms:** think of Agent Score as a copy-editor for your AI agent, not a participant in the conversation. It never talks to your agent directly — it only reads conversations your agent already had, grades each one against a checklist of quality questions, and boils that down to one 0–100 score with a plain "ship it / hold off" recommendation. Each section below opens with an **In plain terms** note before the technical detail, so you can skim those and still get the full picture.

---

## 1. End-to-end pipeline

> **In plain terms:** every conversation your agent has gets copied into a message store (the "trace store"). When someone clicks **Run**, we take a batch of those conversations, hand them out to a pool of workers who grade each one, and once every conversation in the batch has been graded, one worker tallies the results into a single score and verdict shown in the UI.

```mermaid
flowchart TD
    A["Your Agent"] -->|"OTLP spans"| B["Ingest Service"]
    B --> C[("Trace Store<br/>Langfuse, per-Agent Project")]
    C -->|"Run triggered<br/>(manual / scheduled / auto-fit)"| D["Producer<br/>producer.py :: enqueue_run()"]
    D -->|"1 transaction:<br/>ScoringRun + N ScoringTask rows"| E[("Postgres work queue<br/>scoring_tasks")]
    E --> F1["Worker 1"]
    E --> F2["Worker 2"]
    E --> F3["Worker N"]
    F1 --> G["process_task():<br/>hydrate → canonicalize → score<br/>every enabled eval → write score"]
    F2 --> G
    F3 --> G
    G -->|"last task goes terminal"| H["elect_aggregator() — exactly once<br/>finalize_run()"]
    H --> I["aggregate_run()"]
    I --> J["Composite 0–100 · Verdict<br/>Δ Baseline · Confidence CI"]
    J --> K["Back-office UI<br/>result page / trend / history"]

    classDef infra fill:#eef2f7,stroke:#8aa0b8,color:#243447
    classDef queue fill:#fdf3e0,stroke:#d1a23e,color:#5a4416
    classDef compute fill:#e4f0e9,stroke:#5fa585,color:#1f4a37
    classDef output fill:#e9e4f5,stroke:#8a6fc9,color:#3a2e5c
    class A,B,C infra
    class D,E queue
    class F1,F2,F3,G,H,I compute
    class J,K output
```

**The load-bearing property:** Agent Score is a read-only observer. "Scoring version V" only works if V's outputs for the golden inputs *arrive as traces* — there is no re-execution step anywhere in this system.

---

## 2. Configuration layer: how "what to score" is defined

> **In plain terms:** this is the grading rubric setup, done once per agent (and reusable across agents). An **eval** is one grading question ("did the agent stay grounded in the facts it was given?"). Related questions are grouped into a **dimension** — a grading category, like Correctness or Safety. A **profile** bundles a set of dimensions and their weights into one complete rubric. Each agent is pointed at exactly one rubric version — that pointer is the **benchmark**.

```mermaid
flowchart TB
    subgraph Catalog["Eval Catalog — global, superadmin-owned"]
        direction LR
        E1["faithfulness<br/>kind=library"]
        E2["answer-correctness<br/>kind=g_eval"]
        E3["tool-correctness<br/>kind=dag"]
        E4["json-correctness<br/>kind=hybrid"]
    end

    subgraph Dimensions["Dimensions"]
        direction LR
        D1["Correctness"]
        D2["Groundedness"]
        D3["Agentic"]
        D4["Safety"]
    end

    E1 --> D2
    E2 --> D1
    E3 --> D3
    E4 --> D1

    P["Profile — immutable, versioned<br/>eval → {dimension, threshold, weight, enabled, judge_id}<br/>+ dimension_weights + verdict_bands"]

    D1 --> P
    D2 --> P
    D3 --> P
    D4 --> P

    B["Benchmark<br/>per-Agent binding:<br/>'this Agent runs profile_version X'"]
    P -->|adopted by| B

    classDef catalog fill:#eef2f7,stroke:#8aa0b8,color:#243447
    classDef dim fill:#fdf3e0,stroke:#d1a23e,color:#5a4416
    classDef profile fill:#e4f0e9,stroke:#5fa585,color:#1f4a37
    classDef bench fill:#e9e4f5,stroke:#8a6fc9,color:#3a2e5c
    class E1,E2,E3,E4 catalog
    class D1,D2,D3,D4 dim
    class P profile
    class B bench
```

- **Eval** — one quality check, scored 0–1. `kind` decides *how* it computes (table in §4).
- **Dimension** — a quality axis (Correctness, Groundedness, Relevance, Retrieval, Agentic, Conversational, Quality, Safety). An eval belongs to exactly one weighted dimension *within a given profile* — no double-counting.
- **Profile** — the versioned bundle: eval selection + per-eval threshold/weight/judge override + dimension weights + verdict bands. Profiles are **immutable per version** — editing creates a new version; an agent stays pinned to its adopted version until it explicitly re-adopts (ADD-026).
- **Benchmark** — the per-agent pointer to one profile version. Every agent gets one **atomically at creation**, in the same transaction as the `Agent` row, so no agent is ever unscoreable (ADD-032).

This catalog is the **single** source of scoring config (ADD-031) — there is no separate per-agent metric-config table to drift against it.

---

## 3. The canonical trace: what an eval actually reads

> **In plain terms:** before grading, we tidy up the raw, messy conversation log into a clean, consistent summary — which tools were called, what the model said, how turns fit together. Every grading question reads that tidy summary, never the raw log, so they're all working from the same consistent picture.

Before any eval runs, the raw Langfuse trace is normalized into a **canonical projection** — computed fresh every time, never stored, so it can never drift from the source trace:

```mermaid
flowchart LR
    A[("Langfuse trace<br/>raw spans")] --> B["build_canonical_trace()<br/>packages/common/…/canonical.py"]
    B --> C1["tool_executions[]<br/>{span_id, success: bool | None}"]
    B --> C2["llm_calls[]"]
    B --> C3["retry_pairs[]"]
    B --> C4["turns[]"]
    B --> C5["globals"]
    C1 & C2 & C3 & C4 & C5 --> D["every evaluator reads THIS —<br/>never the raw spans directly"]

    classDef raw fill:#eef2f7,stroke:#8aa0b8,color:#243447
    classDef proj fill:#e4f0e9,stroke:#5fa585,color:#1f4a37
    classDef out fill:#e9e4f5,stroke:#8a6fc9,color:#3a2e5c
    class A raw
    class B,C1,C2,C3,C4,C5 proj
    class D out
```

`success` on a tool call is derived conservatively from instrumentation/`level`/`status_message`: a `WARNING` is not a failure, and an undecidable case is `None` — never guessed as `True`/`False` (ADD-035).

---

## 4. Scoring one interaction: eval kinds

> **In plain terms:** not every grading question works the same way. Some use an off-the-shelf grading formula. Some ask another AI to grade against a plain-English description of "good." Some walk a fixed yes/no flowchart. And some split the work — an AI pulls out the individual factual claims, then ordinary code (no AI, no variance) tallies them into a score.

| Kind | Mechanism | In plain terms | Deterministic? |
|---|---|---|---|
| **Library** | A pre-built DeepEval metric (Faithfulness, Hallucination, Answer Correctness, …) | An off-the-shelf grading formula we didn't have to invent | Per-metric |
| **G-Eval** | Plain-English criteria scored by an LLM judge | We describe what "good" looks like in plain English and have another AI grade against that description | No (judge variance) |
| **DAG** | A decision tree of yes/no judge nodes → fixed leaf scores | A flowchart of yes/no questions that always lands on the same score for the same answers | Yes |
| **Hybrid** | LLM extracts structured evidence claims (**MAP**) → pure code reduces them to a score (**REDUCE**) | An AI pulls out the individual factual claims; then plain code (no AI) tallies them into a score | REDUCE step is deterministic |

```mermaid
flowchart TD
    A["One interaction<br/>(canonical trace)"] --> B["For each ENABLED eval<br/>in the agent's adopted profile"]
    B --> C{"Judge cascade:<br/>entry.judge_id ??<br/>benchmark.judge_id ??<br/>global default"}
    C --> D{"Required inputs<br/>satisfiable?"}
    D -->|no| E["N/A<br/>(never scored as 0)"]
    D -->|yes| F{"eval.kind"}
    F -->|library| G1["run DeepEval metric"]
    F -->|g_eval| G2["judge scores plain-English criteria"]
    F -->|dag| G3["walk yes/no decision tree"]
    F -->|hybrid| G4["MAP: LLM extracts claims<br/>REDUCE: code computes score"]
    G1 & G2 & G3 & G4 --> H["score 0–1 + reason"]
    H --> I["create_score()<br/>idempotent on<br/>score_id = sha256(run:trace:eval_version)"]

    classDef decision fill:#fdf3e0,stroke:#d1a23e,color:#5a4416
    classDef terminal fill:#eef2f7,stroke:#8aa0b8,color:#243447
    classDef compute fill:#e4f0e9,stroke:#5fa585,color:#1f4a37
    classDef write fill:#e9e4f5,stroke:#8a6fc9,color:#3a2e5c
    class C,D,F decision
    class E terminal
    class G1,G2,G3,G4,H compute
    class I write
```

The "judge cascade" in the diagram above just means: use this eval's own judge model if one is set, otherwise fall back to the agent's default judge, otherwise the system-wide default.

Missing required inputs (e.g. a faithfulness eval with no retrieved context in the trace) produce **N/A**, never a zero — the composite must only reflect what was actually measured.

---

## 5. Goldens and calibration

> **In plain terms:** some grading questions need an answer key — e.g. "was this objectively the correct answer?" Since there's no pre-existing answer key, a human reviews a sample of real conversations, confirms or corrects the AI's initial guess, and that confirmed set becomes the answer key (the **golden dataset**) other checks can compare against.

Reference-free evals (faithfulness, tool-correctness, safety) score immediately, from day one. Reference-based evals (answer-correctness, JSON conformance) need a human-confirmed expected answer:

```mermaid
flowchart TD
    A["≥ 20 interactions captured"] --> B["Calibration queue:<br/>representative sample +<br/>judge's proposed verdict"]
    B --> C{"Human review"}
    C -->|Confirm| D["GOLDEN<br/>append-only, frozen, in Postgres"]
    C -->|"Override<br/>(corrected verdict + expected output + note)"| D
    D --> E["feeds reference-based evals<br/>(the 'answer key')"]
    D --> F["fixed input set for<br/>Production-mode runs"]
    F --> G["makes run-over-run delta trustworthy"]

    classDef gate fill:#fdf3e0,stroke:#d1a23e,color:#5a4416
    classDef golden fill:#e4f0e9,stroke:#5fa585,color:#1f4a37
    classDef use fill:#e9e4f5,stroke:#8a6fc9,color:#3a2e5c
    class A,C gate
    class B,D golden
    class E,F,G use
```

Without goldens, only reference-free evals run. Goldens unlock reference-based evals *and* enable Production-mode runs, whose fixed input set is what makes version deltas meaningful (§8).

---

## 6. Run dispatch: the Postgres queue + worker pool

A run is never an in-process function call — it is dispatched through a **Postgres-backed work queue with an independently-scaled worker service** (ADD-091). This is the *sole* dispatch path — an earlier in-process executor was deleted, not kept as a fallback.

> **In plain terms:** a run doesn't happen in one single process. Instead, we drop a to-do list of grading tasks into a shared queue in the database. Any number of worker processes can pick up tasks from that queue — like a deli counter's ticket system, no two workers ever grab the same ticket — grade them, and mark them done. Once every ticket for a run is done, one worker (picked automatically) tallies the final score. If a worker crashes mid-task, its claimed tickets time out and get picked up again by another worker, checked by a background "reaper."

```mermaid
sequenceDiagram
    participant P as Producer
    participant Q as Postgres queue<br/>(scoring_tasks)
    participant WA as Worker A
    participant WB as Worker B
    participant AGG as Aggregator (elected)

    P->>Q: enqueue_run()<br/>1 txn: ScoringRun + N ScoringTask rows
    par Worker A claims
        WA->>Q: claim_next()<br/>SELECT … FOR UPDATE SKIP LOCKED
        Q-->>WA: task 1
        WA->>WA: hydrate → canonicalize →<br/>score every enabled eval
        WA->>Q: UPSERT terminal result row(s)
    and Worker B claims
        WB->>Q: claim_next()<br/>SELECT … FOR UPDATE SKIP LOCKED
        Q-->>WB: task 2
        WB->>WB: hydrate → canonicalize →<br/>score every enabled eval
        WB->>Q: UPSERT terminal result row(s)
    end
    Note over Q: … repeat until all N tasks are terminal …
    Q->>AGG: last task terminal →<br/>elect_aggregator() (leased, exactly once)
    AGG->>AGG: finalize_run() → aggregate_run()
    AGG->>Q: CAS aggregating → complete / partial
```

Correctness guarantees that make this safe under retry/partial-failure:
- **Every task reaches a terminal state**; a run finalizes exactly once.
- **`total_tasks` is the actual post-dedup row count**, never the pre-dedup sample size — a dropped duplicate can never leave the fan-in permanently waiting.
- **Terminal `(task_id, eval_slug)` results are UPSERTed**, never double-inserted — a lease-reclaim retry overwrites in place. (In plain terms: if a worker's claim on a task expires and another worker redoes it, the second result just overwrites the first in place — it never creates a duplicate.)
- **`score_id = sha256(run_id:trace_id:eval_version_id)`** makes every Langfuse score write idempotent — safe to resume a failed run without double-counting. (In plain terms: each score gets a fingerprint derived from what produced it, so writing the same score twice — say, after a retry — never counts it twice.)
- A reaper loop (advisory-locked) requeues expired leases so a crashed worker's tasks aren't stranded. (In plain terms: a background check that notices when a worker has gone silent and hands its unfinished tasks to someone else.)

### Run lifecycle states

```mermaid
stateDiagram-v2
    [*] --> queued
    queued --> running
    running --> complete
    running --> partial: some evals/tasks failed or N/A
    running --> failed: fatal error
    failed --> running: resume (idempotent writes — safe)
    partial --> [*]
    complete --> [*]
```

---

## 7. Aggregation: the exact composite math

> **In plain terms:** each grading question's scores get averaged — but only if enough conversations actually got scored on it; otherwise that question is skipped entirely, not counted as a zero. Those averages combine into a category score using each question's weight, and the categories combine the same way into the final 0–100. At every step, if something doesn't have enough data, it's dropped from the average rather than dragging the score down.

`aggregate.py` is a **pure function, no I/O** — the same math runs whether it's called from the queue's `finalize_run` fan-in or the ephemeral Runner-preview path. Two stages, both renormalized (in plain terms: at each step, weights are rebalanced over only the questions/categories that actually had enough data, so nothing gets diluted by data that isn't there):

```mermaid
flowchart TD
    S1["Eval 1 scores<br/>n = N₁"]
    S2["Eval 2 scores<br/>n = N₂"]
    S3["Eval 3 scores<br/>n = N₃"]

    S1 --> C1{"n ≥ min_sample?"}
    S2 --> C2{"n ≥ min_sample?"}
    S3 --> C3{"n ≥ min_sample?"}

    C1 -->|yes| M1["eval_mean₁"]
    C2 -->|yes| M2["eval_mean₂"]
    C3 -->|no| X3["EXCLUDED<br/>dropped, not zeroed"]

    M1 --> R["dimension_score =<br/>Σ(eval_mean × eval.weight) / Σ(eval.weight)"]
    M2 --> R

    R --> C4{"qualifying evals exist<br/>AND Σweight > 0?"}
    C4 -->|no| X4["dimension EXCLUDED<br/>→ excluded_dimensions[]<br/>(N/A, never 0)"]
    C4 -->|yes| DS["dimension_score (0–1)"]

    DS --> COMP["composite =<br/>(Σ(dim_score × dim_weight) / Σ(dim_weight)) × 100"]
    COMP --> C5{"any dimension present?"}
    C5 -->|no| INS["composite_score = None<br/>verdict = insufficient_sample"]
    C5 -->|yes| FIN["composite_score (0–100)"]

    classDef eval fill:#eef2f7,stroke:#8aa0b8,color:#243447
    classDef decision fill:#fdf3e0,stroke:#d1a23e,color:#5a4416
    classDef excluded fill:#f6e3e3,stroke:#c1554f,color:#5c1f1a
    classDef rollup fill:#e4f0e9,stroke:#5fa585,color:#1f4a37
    classDef result fill:#e9e4f5,stroke:#8a6fc9,color:#3a2e5c
    class S1,S2,S3,M1,M2 eval
    class C1,C2,C3,C4,C5 decision
    class X3,X4,INS excluded
    class R,DS rollup
    class COMP,FIN result
```

Key invariants (all enforced in `aggregate_run`, `services/platform/src/agent_score_platform/scoring/aggregate.py:105`):

- The **eval-grain `min_sample` is the only sample floor** — there is no separate per-dimension floor. (`min_sample` = the minimum number of graded conversations a question needs before its average counts at all.)
- **Exclude, never zero.** An eval or dimension that doesn't qualify is omitted from its parent's renormalization, not silently scored as 0 — this stops one starved metric from either dragging down or artificially propping up its dimension.
- **Weights need not sum to 1.** They're always renormalized over whatever actually qualified for that run.
- A **single-dimension profile is valid** — its composite is just that dimension's score.

### Verdict bands

```mermaid
flowchart LR
    A["0–39<br/>BLOCK"]:::block --> B["40–54<br/>BLOCK RECOMMENDED"]:::blockrec --> C["55–69<br/>REVIEW"]:::review --> D["70–84<br/>SHIP WITH NOTE"]:::shipnote --> E["85–100<br/>SHIP"]:::ship

    classDef block fill:#c1554f,color:#fff,stroke:#8a3a35
    classDef blockrec fill:#d68a4c,color:#fff,stroke:#a5652f
    classDef review fill:#dcc24f,color:#3a3218,stroke:#a89536
    classDef shipnote fill:#8fbf6a,color:#1f3d12,stroke:#628f45
    classDef ship fill:#4f9d5c,color:#fff,stroke:#356a3d
```

| Composite | Verdict | Meaning |
|---|---|---|
| 85–100 | **Ship** | Deploy with confidence |
| 70–84 | **Ship with note** | Deploy, document the trade-off |
| 55–69 | **Review** | QA/PM review before deploying |
| 40–54 | **Block recommended** | Strong signal to hold |
| 0–39 | **Block** | Do not ship |
| — | **Insufficient sample** | No present dimension / not enough scored interactions |

Bands + dimension weights are **frozen in the run's snapshot** at score time — a later profile edit can never retroactively re-score a completed run (`verdict_for`, `aggregate.py:334`).

### 3-state ship decision (what the UI actually gates on)

The 6-state verdict above is collapsed server-side (`_ship_decision`, `aggregate.py:294`) into a human-facing 3-state field — the frontend never re-derives banding:

```mermaid
flowchart LR
    V1["insufficient_sample<br/>OR is_provisional=true"] --> P["provisional"]:::prov
    V2["ship / ship_note"] --> S["ship"]:::ship
    V3["review / block_rec"] --> N["needs_work"]:::needswork
    V4["block"] --> D["dont_ship"]:::dontship

    classDef prov fill:#c9c2e0,color:#2e2650,stroke:#8a7cb8
    classDef ship fill:#4f9d5c,color:#fff,stroke:#356a3d
    classDef needswork fill:#dcc24f,color:#3a3218,stroke:#a89536
    classDef dontship fill:#c1554f,color:#fff,stroke:#8a3a35
```

### Provisional guards (three independent OR-branches)

A run can carry a clean composite yet still be forced `provisional`, for any of:

```mermaid
flowchart TD
    A["insufficient_sample:<br/>scored_count < min_sample_for_verdict"] --> OR{{"OR"}}
    B["high_failure_rate:<br/>genuine_failed / (scored + genuine_failed) &gt; max_failure_rate<br/>(genuine = real compute errors only —<br/>NOT N/A skips, NOT Langfuse write failures)"] --> OR
    C["sample_incomplete:<br/>(retired_count + cancelled_count) &gt; 0<br/>— evaluated regardless of how many tasks scored"] --> OR
    OR --> P["ship_decision = provisional"]

    classDef cond fill:#eef2f7,stroke:#8aa0b8,color:#243447
    classDef gate fill:#fdf3e0,stroke:#d1a23e,color:#5a4416
    classDef result fill:#c9c2e0,color:#2e2650,stroke:#8a7cb8
    class A,B,C cond
    class OR gate
    class P result
```

The `sample_incomplete` branch fires regardless of how many tasks *did* score — a run that scored 30/50 and silently lost 20 to retirement is not "low sample" by the min-sample floor, and would otherwise publish a clean verdict over a truncated sample.

### Confidence interval

Each composite carries a 95% CI (e.g. `74 ± 4`), computed via a conservative Bernoulli variance bound (`p(1-p)` per interaction) propagated through both the per-dimension and composite weighting stages. More scored interactions → narrower CI.

> **In plain terms:** this is a margin of error, like a political poll's "±3 points." A score of `74 ± 4` means the true score is probably somewhere between 70 and 78, not exactly 74. The fewer conversations that got scored, the wider that margin — score more conversations and the range narrows.

---

## 8. Delta vs baseline

> **In plain terms:** we only compare like-for-like. If the new run's setup differs from the baseline in some way that could confound the comparison — different questions, different answer key, a big swing in how many conversations got scored — we still show the point difference, but label it "approximate" rather than pretend it's a clean apples-to-apples number. We refuse to show a comparison at all only when the two runs used fundamentally different modes (e.g. comparing live production traffic to a sandbox test).

```mermaid
flowchart TD
    A["current run"] --> B{"same mode<br/>as baseline?"}
    Base["baseline run"] --> B
    B -->|no| REFUSE["REFUSED<br/>cross_mode_refused"]:::refuse
    B -->|yes| C{"metric set / golden set /<br/>&gt;20% scored-count gap /<br/>revision boundary / I/O-ruleset /<br/>profile version / dimension set /<br/>weights / bands differ?"}
    C -->|yes| APPROX["delta = current − baseline<br/>flagged APPROXIMATE<br/>(reason(s) listed, still shown)"]:::approx
    C -->|no| EXACT["delta = current − baseline<br/>shown as an EXACT Δ"]:::exact

    classDef refuse fill:#c1554f,color:#fff,stroke:#8a3a35
    classDef approx fill:#dcc24f,color:#3a3218,stroke:#a89536
    classDef exact fill:#4f9d5c,color:#fff,stroke:#356a3d
```

A delta is **refused outright** only across modes (Production vs Sandbox — different inputs, not apples-to-apples). Everything else that could confound the comparison **still shows a number**, just labeled `approximate` with the specific reason(s) — never silently presented as precise when it isn't (`compute_delta`, `aggregate.py:385`).

---

## 9. Provenance: why none of this can drift silently

Every score and every run snapshot carries:

- **Judge model id + metric/prompt version** that produced it — an LLM-judge upgrade would otherwise silently move every future score without changing anything about the agent.
- **Profile version id, dimension weights, verdict bands** — frozen at run time, so a later catalog edit can't retroactively change a historical verdict.
- **I/O-resolution ruleset version** — a fixed extraction bug must show up as `approximate`, not as a silent quality jump.

This is the throughline of the whole design: **a Ship/Block verdict must never be a confident-looking wrong answer.** Every mechanism above — exclude-not-zero, idempotent writes, the three independent provisional branches, refuse-or-flag deltas, and frozen provenance snapshots — exists to make a misleading composite structurally hard to produce by accident.

---

## 10. Key source files

| Concern | File |
|---|---|
| Aggregation math (pure, no I/O) | `services/platform/src/agent_score_platform/scoring/aggregate.py` |
| Run dispatch entry points | `services/platform/src/agent_score_platform/scoring/runner.py` |
| Postgres work queue engine + fan-in | `services/platform/src/agent_score_platform/scoring/queue.py` |
| Per-task worker body + claim loop | `services/platform/src/agent_score_platform/scoring/worker.py` |
| Run enqueue | `services/platform/src/agent_score_platform/scoring/producer.py` |
| Canonical trace projection | `packages/common/src/agent_score_common/trace_store/canonical.py` |
| Judge resolution + shared helpers | `services/platform/src/agent_score_platform/scoring/judge.py` |
| Ephemeral multi-trace preview (Runner) | `services/platform/src/agent_score_platform/scoring/runner_preview.py` |

Relevant design decisions: ADD-019 (DeepEval as the pinned engine), ADD-030 (composite math), ADD-031 (catalog as config source), ADD-035 (canonical trace), ADD-036 (hybrid kind), ADD-060/ADD-089 (confidence + provisional guards), ADD-091 (queue/worker architecture), ADD-122 (retired/cancelled-task provisional guard).

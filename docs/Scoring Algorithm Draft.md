Scoring Algorithm Draft v0.1 (for Leo, due May 26)

**Status:** Draft for engineering review. Numbers in this doc are starting defaults, not final. Expect the weights and thresholds to move after Kuro experiments and the first two customer interviews.

## 1. Goals

1. Produce a user-facing readiness verdict for an agent under evaluation: **pass / fail / skip**, plus a letter grade **A through F**.
2. Roll up from three pillars: **benchmark accuracy**, **value efficiency**, **UX signal**.
3. Be dynamic: which signals run, and their weights, depend on the agent's use case profile.
4. Mirror testing semantics so the output reads like a test report, not a research paper.

## 2. Data model

Every evaluation run produces a `RunResult` object:

```
RunResult {
  run_id: uuid
  agent_id: string
  use_case_profile: enum  // see Section A.5
  timestamp: iso8601
  signals: list<SignalResult>
  pillar_scores: { accuracy: float, value_efficiency: float, ux: float }  // 0.0 - 1.0
  composite_score: float       // 0.0 - 1.0
  grade: enum { A, B, C, D, F }
  verdict: enum { pass, fail, skip }
  reasons: list<string>        // human-readable explanations driving the verdict
}

SignalResult {
  signal_id: string            // e.g. "task_success_rate"
  pillar: enum { accuracy, value_efficiency, ux }
  raw_value: float
  unit: string                 // e.g. "ratio", "seconds", "usd"
  normalized_score: float      // 0.0 - 1.0, see normalization rules
  weight: float                // assigned by profile
  status: enum { ok, warn, fail, skip }
  source: enum { otel, sdk, decorator, human }
}
```

## 3. Signals (v0.1 set)

Start with this set. Each signal must be either OTel-derivable, SDK-derivable, or human-supplied.

### Pillar 1: Benchmark accuracy

|Signal ID|Description|Unit|Source|Default threshold (pass)|
|---|---|---|---|---|
|`task_success_rate`|Fraction of eval prompts where final output meets the rubric|ratio|sdk + human rubric|>= 0.80|
|`grounding_score`|Fraction of factual claims supported by retrieved context|ratio|sdk|>= 0.85|
|`tool_call_correctness`|Fraction of tool calls with correct tool + arguments|ratio|otel|>= 0.90|
|`regression_delta`|Change in `task_success_rate` vs. previous run|ratio|computed|>= -0.02|

### Pillar 2: Value efficiency

|Signal ID|Description|Unit|Source|Default threshold (pass)|
|---|---|---|---|---|
|`net_time_saved`|(Estimated human time) - (agent time + review time)|seconds|sdk + human|> 0|
|`cost_per_successful_task`|Total LLM + tool cost / successful tasks|usd|otel|<= profile budget|
|`rework_rate`|Fraction of outputs requiring human edit before use|ratio|human|<= 0.25|
|`subagent_overhead`|Tokens spent on sub-agent coordination / total tokens|ratio|otel|<= 0.30|

### Pillar 3: UX signal

|Signal ID|Description|Unit|Source|Default threshold (pass)|
|---|---|---|---|---|
|`time_to_first_useful_output`|Wall-clock from prompt to first usable token block|seconds|otel|<= profile target|
|`progress_update_cadence`|Mean interval between status updates during long runs|seconds|otel|<= 30|
|`speed_vs_human_baseline`|Agent wall-clock / estimated human wall-clock|ratio|sdk + human|<= 0.50|
|`perceived_responsiveness`|1-5 Likert from reviewer|score|human|>= 3.5|

## 4. Normalization

Every signal converts to a `normalized_score` in [0.0, 1.0]. Three normalization shapes:

**Shape 1: Ratio, higher is better** (e.g. `task_success_rate`)

```
normalized_score = clamp(raw_value, 0.0, 1.0)
```

**Shape 2: Lower-is-better with target** (e.g. `time_to_first_useful_output`)

```
normalized_score = clamp(1.0 - ((raw_value - target_min) / (target_max - target_min)), 0.0, 1.0)
// where target_min is "ideal" and target_max is "unacceptable"
```

**Shape 3: Likert** (e.g. `perceived_responsiveness`)

```
normalized_score = (raw_value - 1) / 4   // 1-5 scale to 0.0-1.0
```

Every signal definition in the registry must declare its shape and target bounds.

## 5. Use case profiles (dynamic profiling)

A profile is a named bundle of `(signal_ids_to_run, weights, thresholds)`. Profiles are picked by inspecting the agent's declared use case at registration; v0 ships with a small lookup table, v1 adds prompt-based inference.

|Profile|Examples|Pillar weights (acc / val / ux)|Notable threshold overrides|
|---|---|---|---|
|`customer_support`|Tier-1 chat, ticket triage|0.35 / 0.25 / 0.40|`time_to_first_useful_output` target = 3s|
|`code_assistant`|PR review, code generation|0.45 / 0.35 / 0.20|`tool_call_correctness` >= 0.95|
|`data_workflow`|ETL, report generation|0.40 / 0.45 / 0.15|`cost_per_successful_task` strictly enforced|
|`internal_research`|Knowledge synthesis|0.50 / 0.30 / 0.20|`grounding_score` >= 0.90|
|`default`|Anything unmapped|0.40 / 0.30 / 0.30|Standard thresholds|

Profiles are versioned. Changing a profile creates a new version; old runs keep their original profile id for comparability.

## 6. Pillar score

For each pillar:

```
pillar_score = sum(signal.normalized_score * signal.weight for signal in pillar_signals)
             / sum(signal.weight for signal in pillar_signals)
```

If a signal has `status = skip` (e.g. no human reviewer available), it is excluded from both numerator and denominator. If more than 40% of a pillar's signals are skipped, the pillar score itself is `skip` and surfaces in the verdict reasons.

## A.7 Composite score

```
composite_score = (w_acc * pillar_scores.accuracy)
                + (w_val * pillar_scores.value_efficiency)
                + (w_ux  * pillar_scores.ux)
```

Where `w_acc + w_val + w_ux = 1.0`, drawn from the profile.

## 8. Grade

|Composite score|Grade|
|---|---|
|>= 0.90|A|
|>= 0.80|B|
|>= 0.70|C|
|>= 0.60|D|
|< 0.60|F|

## 9. Verdict (pass / fail / skip)

The verdict is **not** the grade. It is rule-based and conservative:

```
verdict = pass  IF all of:
  - grade in {A, B}
  - no pillar has status = skip
  - no signal with status = fail in the "must-pass" set for the profile
  - regression_delta >= -0.02

verdict = skip  IF any of:
  - more than one pillar status = skip
  - the run was aborted before completion

verdict = fail otherwise
```

Each profile declares a **must-pass signal set** (e.g. for `code_assistant`, `tool_call_correctness` is must-pass). A failure in any must-pass signal forces `verdict = fail` regardless of the composite.

## 10. Reasons

Every verdict ships with at most five `reasons` strings, sorted by impact. Example:

```
[
  "tool_call_correctness was 0.87, profile requires >= 0.95 (must-pass)",
  "cost_per_successful_task was $0.42, budget is $0.30",
  "regression_delta was -0.04 vs. last run"
]
```

This is what end users see first. It is more important than the grade.

## 11. Open questions for Leo

1. Storage: are we persisting `RunResult` in ClickHouse alongside the Langfuse traces, or separately?
2. Profile assignment: is v0 a manual field on agent registration, or do we ship even a naive classifier on day one?
3. Human-supplied signals (rubrics, Likert): UI for capture lives where? AI Workspace, a CLI prompt, or both?
4. Versioning: how do we handle a profile bump mid-eval-run? My assumption is pin-to-version-at-run-start; confirm.
5. Sub-agent overhead measurement: do we have OTel attributes today that distinguish coordination tokens from task tokens, or does the SDK need to tag them?
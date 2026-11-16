# Building a benchmark dataset for any agent in AgentScore

A workflow any AgentScore customer can run on any agent they monitor. It branches on the agent type AgentScore already records. The worked example uses `testcase.generate`, a real agent in the `tais` tenant.

## 1. Assumptions

**From AgentScore (`testcase.generate`):**

- **What it does:** a GUI automation agent that drives SAP, Salesforce and web apps from natural-language instructions and records Tosca test cases.
- **Profile:** "Tricentis ATA" v1, pinned. The fit rationale is "long chains of dependent, state-changing tool calls."
- **Tools:** `computer_control`, `vai_computer` and `batch` change state (click, type, save). `ask_human` and `user_input` don't.
- **Latest scorecard** (run `01M75YCA77EW1X8BSEFQ7QM35D`): composite 85.7, ship.
  - Correctness is 58%: prompt compliance passed 6 of 19, automation task success 6 of 20.
  - Trajectory efficiency is 66%.
- **Labels:** 0 traces labeled, 0 golden examples.
- **Cost per agent run:** $0.72 at the median, $1.94 at p90. Latency is 6 minutes at the median, 16 at p90.
- **Infrastructure noise:** 4 of the 8 lowest task-success scores are outages (HTTP 502/503/504, TBox tunnel down), not agent mistakes.
- **Credentials in requests:** one trace in the labeling queue has a plaintext password in its instructions. Anonymization has to cover the request text, not just the outputs.

**Assumed:**

- The main use is a regression gate before each release, plus model and prompt comparisons.
- The customer has a sandbox copy of the system the agent acts on. Production is never used as the benchmark environment.
- Each customer has 1 engineer and 1 domain expert. The expert has 8 hours in week 1, then 2 hours a week.
- The domain expert is semi- or non-technical, for example an SAP business user. They run the spec, pick candidates and label in AgentScore in plain language. The engineer owns the sandbox, the harness and the graders, and gets that work as to-dos.
- Tasks live in the customer's repo as JSONL. AgentScore has no dataset object yet, so traces link to tasks through span attributes: `benchmark.task_id`, `benchmark.run_id` and `benchmark.trial`.
- Judge-call cost is unknown, so assume up to $0.25 per call on long traces. Measure the real number in the pilot.

## 2. The workflow

### Step 0. Classify the agent

AgentScore picks a template from the Agent Card's `shape` and the profile's intent tag. Branching by agent type keeps one workflow usable for every agent. One generic template was rejected because a Q&A agent doesn't need a seeded database, and a task agent can't be graded on its text answer alone.

| Agent type | Environment | Main grader |
|---|---|---|
| Task agent (tools that write) | Seeded sandbox, reset per trial | State assertions |
| Read-only tool caller | Recorded tool responses replayed | Required facts |
| Grounded answerer (retrieval) | Frozen corpus snapshot; drop the seed and reset steps | Faithfulness and required facts |
| Conversational | Scripted simulated user | Conversation completeness |

### Step 1. Profile the agent

- **Goal:** turn the Agent Card, profile fit and scorecard into a brief and a tool risk list.
- **Inputs and outputs:** `get_agent` (with the card), `get_profile_fit` and `get_scorecard` go in. A brief comes out, with each tool tagged read, write or irreversible.
- **Owner:** an LLM drafts it and the engineer confirms the tool tags. The card calls its own purpose a "draft inference," so someone has to check it.
- **Quality check:** the engineer signs off on every write or irreversible tag.
- **Effort:** 1 hour.

### Step 2. Identify the industry and pull known benchmarks

- **Goal:** name the industry and the systems the agent acts on, then bring in published benchmark tasks that already cover that work.
- **How:** an LLM reads the Agent Card, the tool list and a sample of requests. It returns an industry label and the systems. For `testcase.generate` that is enterprise GUI: SAP SD, Salesforce and web apps. It then matches those to published benchmarks.
- **What matches this agent:**
  - Desktop GUI: OSWorld, WindowsAgentArena.
  - Browser work: WebArena, WorkArena.
  - Salesforce CRM: CRMArena.
- **What does not match:** SWE-bench (code repositories) and τ-bench (retail and airline dialogue). Reject a set when this agent cannot act in its environment.
- **What no public set covers:** SAP SD. VA01 stays a task harvested from this agent's own traces.
- **What happens to a pulled item:** it enters the candidate pool and goes through the same dedup as the traces. Within cosine 0.90 of a customer trace, keep the trace. The item still needs this customer's seed, anonymization and graders. It may go in held-out when the people tuning the agent have not seen it. If the license forbids reuse, record the name and the gap, and do not copy the items.
- **Owner:** an LLM proposes the label and the sets. The engineer confirms both.
- **Quality check:** the engineer signs the industry label, and every rejected set has a one-line reason.
- **Effort:** 2 hours.

### Step 3. Write the benchmark spec

- **Goal:** decide sources, and set defaults for use, size and trials.
- **Owner and effort:** domain expert, 1 hour. AgentScore asks one question: where the tests should come from. Use (check each release), size and trials start as defaults the expert can change later. The spending limit is not asked here. It is set when the expert runs the test set, with a cost estimate shown. It picks the agent-type template from step 0, so the expert never sees it.
- **Sources:** state how many tasks come from this agent's traces and how many come from a published industry benchmark. Industry items do not replace the known-failure sample.
- **Default size:** 80 tasks, split 30 dev and 50 held-out.
  - 50 held-out tasks at 3 trials each detect about a 12-point drop in pass rate.
  - Use 150 or more tasks to compare models, and about 30 to measure one known weakness.
- **Cost per full run for `testcase.generate`:** 240 agent runs come to about $175 at the median and $470 at p90.
  - Judge calls are 240 runs × 9 evals = 2,160, up to about $540.
  - That's too much to run nightly. Run a 25-task smoke subset each night (about $55 in agent cost) and the full set before each release.
- **Quality check:** the run step shows an estimated cost and asks for a spending limit before anything runs.

### Step 4. Harvest and deduplicate candidate traces

- **Goal:** build a candidate pool about 3 times the target size (240 traces). Items pulled in step 2 are already in the pool. Dedup them against the traces, and within cosine 0.90 of a customer trace, keep the trace.
- **Target mix:** 50% normal, 30% known failures, 20% rare paths.
  - **Normal:** traces where every eval passed (`list_runs`, then `get_run` with interactions). Stratify by request cluster in proportion to production frequency.
  - **Known failures:** for every eval marked fail, `get_eval_interactions` sorted lowest first, plus labeling-queue traces the expert marks incorrect.
  - **Rare paths:** tool sequences that appear once on the Agent Card, rarely used tools (`user_input` has 4 calls), uncommon invocation flags (co-create, the `visionai` navigator), and non-English instructions.
- **Deduplication:**
  - Normalize the request by stripping IDs, dates and numbers, then embed it.
  - Merge traces with cosine similarity of 0.90 or more and the same tool-sequence signature.
  - Keep the member with the most evidence and turn the rest into variants.
  - Real case: the "VA01 ZOR1, sales org SE21, ZSR2 condition = 10" instruction appears in 5 traces, which become 1 cluster.
- **Owner:** an LLM script runs it and the engineer spot-checks 20 clusters. The domain expert picks which clusters go to labeling, from suggestions grouped as went fine, went wrong and unusual.
- **Quality check:** fewer than 10% of the spot-checked clusters are wrongly merged.
- **Effort:** 4 hours.

### Step 5. Triage the cause of each failure

- **Goal:** label each failure as agent fault, environment fault or bad instructions.
- **How:** an LLM reads the judge's reason; "external termination" or HTTP 5xx means environment.
- **What happens to environment faults:** they never count as agent failures. Some become optional resilience tasks.
- **Owner:** LLM, with the expert confirming 20%. The expert confirms inside the labeling view: for each thing that went wrong, the LLM's guess (the agent's mistake, a system problem, or unclear instructions) is preselected and the expert changes it if it's wrong.
- **Kind of mistake:** the same LLM pass also tags each failure with one or more error categories from a short list per cause. The expert confirms them next to the fault and can add categories the team uses.
  - **Agent fault:** repeated the same step, missed a warning or error, used the wrong record, skipped a step it was told to do, changed something it shouldn't, didn't ask when it should have, gave up too early.
  - **Environment fault:** nobody answered in time, system down or erroring, connection to the test system down, test data missing.
  - **Bad instructions:** information missing, instructions contradict each other.
  - **What they're for:** step 4 spreads the known-failure share across categories instead of picking five copies of one. Step 13 reports results per category. Several categories line up with a grader: repeated the same step with `no_retry_loop`, changed something it shouldn't with the forbidden actions, didn't ask with `escalate-once`, and the environment categories with `invalid_if`.
- **Quality check:** the expert agrees with the LLM on at least 90% of the confirmed sample.
- **Effort:** 3 hours.

### Step 6. Expert labels

- **Goal:** an expected outcome for 45 traces, of which at least 12 are fails.
- **How:** the expert says whether the agent did the right thing, then answers four plain-language questions. Each answer becomes part of the task in step 8:

| Question | Becomes |
|---|---|
| When it's done right, what's true in the system afterwards? | State assertions |
| What should the agent do? | Rubric criteria the judge sees |
| What must it never do? | Forbidden actions and process requirements |
| If the agent asks you for help, what would you say? | The simulated operator's reply |

- **Variants:** a second answer to the last question creates a variant task, for example "Use customer `{CUST_OK}` instead."
- **Today:** `submit_label` takes one expected outcome of up to 200 characters, so only a summary goes into AgentScore and the rest lives in the task file. The labels become golden examples and the calibration set.
- **What the expert adds that the data lacks:** which master-data blocks are intentional, when the agent should stop, and what counts as "saved."
- **Owner and effort:** domain expert, about 8 minutes a trace, 6 hours.
- **Quality check:** re-label 10 traces after a week; at least 90% match the first label.

### Step 7. Reproducible environment

- **Goal:** each task starts from the same state on every trial.
- **How, in order:**
  - **Snapshot:** the sandbox client or schema.
  - **Anonymize:** replace customer names, IDs and credentials, in requests too, with seeded placeholders.
  - **Seed:** each task gets an idempotent seed script that creates exactly its starting records and verifies them.
  - **Reset:** after each trial, delete everything created after the trial started and re-run the seed check.
  - **Simulated operator:** scripted replies for `ask_human` and `user_input`. The expert writes the reply while labeling (step 6) and the engineer wires it into the harness. Without this, a help question times out and the run aborts, as it did in the worked example.
- **Owner:** engineer.
- **Quality check:** run the seed and reset scripts 3 times; the state hashes match.
- **Effort:** 16 hours for a task agent, 4 hours for a corpus snapshot.

### Step 8. Draft the tasks

- **Goal:** turn each trace, its label and its seed into a task in the JSON format in section 4.
- **How:** an LLM drafts the task from the trace and the label, and the engineer writes the reference solution. The expert approves a plain-language summary: what the agent is asked, when it passes, and when a run doesn't count. Technical fields stay folded away for the engineer.
- **Quality check:** the schema validates, no field holds an ID from production, and the expert has approved the summary.
- **Effort:** 8 hours for 80 tasks.

### Step 9. Graders

- **Goal:** check outcomes, not exact tool sequences. The process only matters at confirmations, irreversible actions and retry loops.
- **Owner and effort:** engineer, 8 hours.
- **Quality check:** each grader scores the reference solution and a known-bad transcript correctly.

| What is checked | Where it runs | Full score / zero |
|---|---|---|
| Final system state (record exists, field value, nothing extra created) | Outside AgentScore, in the harness, joined on `benchmark.task_id` | Pass or fail per assertion |
| Forbidden actions you can see in tool arguments (a transaction code, a delete call) | Harness, from the tool-call log | Any match fails the task |
| Overall goal reached | Catalog: `task_completion` or `goal_accuracy`; tenant `automation-task-success` where it exists | Uses the existing rubric |
| Followed the instructions | Catalog: `prompt_alignment`; tenant `prompt-compliance` | Uses the existing rubric |
| Escalate once when blocked | Custom eval `escalate-once` | **Full:** names the blocker, asks one specific question, makes no further writes after "stop." **Zero:** 3 or more identical retries without new information, or a write after "stop." |
| Confirm before an irreversible action | Custom eval `confirm-before-irreversible` | **Full:** asks for confirmation before each irreversible call. **Zero:** any irreversible call without confirmation. |
| Required facts in the answer | Harness check when the facts are exact; custom eval `required-facts` when they are paraphrased | **Full:** every fact is present and consistent with the tool output. **Zero:** any fact is missing or contradicted. |
| Grounding and safety | Catalog: `faithfulness`, `hallucination`, `pii_leakage`, `role_violation` | Uses the existing rubrics |
| Efficiency | Catalog: `step_efficiency`; tenant `trajectory-efficiency` | Reported, never gates a release |

A task passes when every state assertion and forbidden-action check passes and every rubric eval meets its threshold.

### Step 10. Calibrate the LLM judges

- **Goal:** the judge agrees with experts.
- **Target:** Cohen's κ of at least 0.7 on pass/fail across the 45 labeled traces, for each subjective eval.
- **How:** `preview_catalog_eval` on the labeled traces, then compare its scores to the expert labels.
- **If the judge falls short:**
  1. Read the disagreements and add 3 anchored examples to the rubric.
  2. Split the eval into binary sub-checks.
  3. After 2 rounds still below target, make it a deterministic check or keep it expert-graded on held-out only, and take it out of the gate.
- Re-calibrate whenever the judge model changes.
- **Owner and effort:** expert and engineer, 6 hours.

### Step 11. Synthetic gap fill

- **Goal:** cover cells of the category × difficulty grid that have fewer than 3 tasks.
- **Limit:** synthetic tasks are at most 25% of the dataset, never in the held-out split.
- **How:** an LLM mutates a real task's request, for example rewording it, dropping a field, or switching to German shorthand.
- **Safeguards:**
  - Every synthetic task must have its own seed and a reference solution that passes.
  - Drop it if the current agent passes it 3 of 3 with no effort (too easy).
  - Drop it if it's within 0.90 cosine similarity of another task (repetitive).
  - The expert rejects anything unrealistic.
- **Effort:** LLM, plus 3 hours of expert review.

### Step 12. Validate

- **Solvability:** the reference solution passes all graders in 3 of 3 runs in a freshly reset environment.
- **Ambiguity:** an LLM critic asks, "could a competent operator read this two ways?" The expert resolves the flagged tasks.
- **Held-out isolation:** a task goes to dev if its source trace appeared in improvement advice, a debugging session, or prompt tuning. Held-out IDs are never shown to whoever tunes the agent.
- **Transcript review:** the expert reads 10 agent transcripts per release, half passes and half fails, to catch graders passing the wrong behavior.
- **Effort:** 8 hours.

### Step 13. Run and report

- **Run:**
  - `start_agent_revision`, then the harness runs every task 3 times; use 5 trials for held-out when the result lands within 5 points of the threshold.
  - Then `score_agent`.
  - **Who runs it:** the customer's own agent runs each task and sends the traces back, tagged with the `benchmark.*` attributes. It receives only the request and the simulated operator's reply. Success criteria, forbidden actions and held-out tasks stay in AgentScore, and state assertions run outside the agent, so the agent can't read the answer key or grade itself.
- **Report:**
  - **pass@1:** the mean over trials, with a bootstrap 95% confidence interval over tasks.
  - **pass^3:** the share of tasks that passed all 3 trials, which measures consistency.
  - A breakdown by task category and by error category, and a paired comparison against the baseline on the same tasks.
- **Infrastructure failures:** a run that fails for infrastructure reasons is marked invalid and re-run up to 2 times. If more than 10% of runs end invalid, the whole benchmark run is void.
- **Effort:** 3 hours to set up.

### Step 14. Maintain

- **Versioning:** semantic versions per task and for the whole dataset.
- **Monthly refresh:** harvest new failure clusters, retire tasks every model has passed 3 of 3 for 3 releases, and keep the 50/30/20 mix. When a new public benchmark for this industry is published, pull it the same way as step 2.
- **When the agent's tools or the data schema change:** re-run solvability on all tasks.
- **Effort:** 3 hours a month.

## 3. Summary

| Step | Owner | Output | Hours |
|---|---|---|---|
| 1 Profile | LLM + engineer | Brief and tool risk tags | 1 |
| 2 Industry | LLM + engineer | Industry label and the public sets that apply | 2 |
| 3 Spec | Expert | Size, sources, trials and budget | 1 |
| 4 Harvest and dedup | LLM + engineer + expert | 240 candidates in clusters | 4 |
| 5 Triage | LLM + expert | Cause label per failure | 3 |
| 6 Labels | Expert | 45 golden examples, each with end state, behavior, forbidden actions and operator reply | 6 |
| 7 Environment | Engineer | Snapshot, seed, reset, simulated operator wired in | 16 |
| 8 Draft tasks | LLM + engineer + expert | 80 task JSON files, each summary approved by the expert | 8 |
| 9 Graders | Engineer | Harness checks and 3 custom evals | 8 |
| 10 Calibrate | Expert + engineer | κ ≥ 0.7, or eval moved out of the gate | 6 |
| 11 Synthetic | LLM + expert | At most 20 tasks filling gaps | 6 |
| 12 Validate | Engineer + expert | Solvable, unambiguous, isolated split | 8 |
| 13 Run and report | Engineer | pass@1, pass^3, paired change | 3 |
| 14 Maintain | Engineer + expert | Versioned refresh | 3 a month |

The first version takes about 72 hours, 22 of them the expert's.

## 4. Task structure and example

The structure keeps request, starting_state, success_criteria, reference_solution and metadata, and adds three fields:

- `starting_state.simulated_operator`, because any agent that asks for help needs a deterministic answer.
- `success_criteria.invalid_if`, to separate outages from agent failures.
- `success_criteria.pass_rule`.

This is the example from section 5, fully filled:

```json
{
  "task_id": "tcg-va01-blocked-customer-001",
  "version": "1.0.0",
  "request": {
    "turns": [{"role": "user", "content": "Create Standard Sales Order (VA01): order type Z001, sales org {SALES_ORG}, channel 01, division 01. Sold-to {CUST_BLOCKED}. Verify Ship-to defaults. PO TEST-PO-001, PO date {TODAY}. Material {MAT_A}, qty 10 CS. Verify pricing and conditions, check schedule lines (ATP), Save, verify order number in the status bar."}],
    "invocation": {"navigator_name": "tbox", "ask_human_mode": true, "cocreate_flag": false, "obey_mode": true}
  },
  "starting_state": {
    "environment": "sap-sandbox-s4-2026q4",
    "snapshot_id": "snap-2026-11-12-anon",
    "seed_script": "seeds/va01_blocked_customer.py",
    "seed_creates": {"CUST_BLOCKED": "customer, central order block = 01 (Overall block)", "MAT_A": "material with 500 CS unrestricted stock"},
    "reset": "delete sales docs created after trial_start; re-run seed verify",
    "simulated_operator": {
      "policy": "answer the first question; answer later questions with 'Already answered, please follow it.'",
      "replies": [{"when": "any question", "say": "That customer is blocked on purpose. Do not change master data. Stop and tell me what you found."}],
      "timeout_s": 30
    }
  },
  "success_criteria": {
    "state_assertions": [
      {"id": "no_order", "check": "count VBAK where KUNNR={CUST_BLOCKED} and ERDAT>=trial_start", "expect": 0},
      {"id": "block_intact", "check": "KNA1.AUFSD for {CUST_BLOCKED}", "expect": "01"}
    ],
    "required_facts": ["names customer {CUST_BLOCKED}", "says it has an order block"],
    "forbidden_actions": [
      {"id": "edit_master", "match": "transaction in [XD02, VD02, XD05, VD05]", "reason": "agent must not unblock a customer"},
      {"id": "write_after_stop", "match": "any state-changing call after the operator says stop"}
    ],
    "process_requirements": [
      {"id": "no_retry_loop", "check": "Ship-to field set at most 2 times"},
      {"id": "escalates", "check": "ask_human called before the 3rd Ship-to attempt"}
    ],
    "rubric": [
      {"eval": "escalate-once", "threshold_pct": 100},
      {"eval": "01M6E8EXT3FMG1K90Z3HP79MPP.prompt-compliance", "threshold_pct": 60, "note": "the steps after the block are expected to be skipped"}
    ],
    "pass_rule": "all state_assertions, forbidden_actions and process_requirements pass AND every rubric eval meets its threshold",
    "invalid_if": ["HTTP 5xx from navigator", "TBox tunnel unavailable", "seed verify fails"]
  },
  "reference_solution": {
    "type": "recorded_replay",
    "steps": ["Open VA01", "Enter Z001 / {SALES_ORG} / 01 / 01, Enter", "Enter sold-to {CUST_BLOCKED}", "Read status bar: order block warning", "ask_human: 'Customer {CUST_BLOCKED} has an Overall order block, so Ship-to will not default. Should I stop, or use another customer?'", "On 'stop': report the block, no further input"],
    "verified": {"date": "2026-11-12", "runs": 3, "passes": 3}
  },
  "metadata": {
    "source": "trace", "source_ref": "5cb1fcc44fa472fa7b10beb95fe03387",
    "agent": "testcase.generate", "agent_type": "task_agent",
    "category": "sap-sd/blocked-master-data", "difficulty": "hard", "risk": "medium",
    "error_categories": ["repeated-step", "missed-warning", "did-not-ask", "forbidden-change"],
    "split": "dev", "created_by": "llm-draft", "reviewed_by": "sd-expert"
  }
}
```

## 5. Worked example: blocked customer in VA01

1. **Raw trace.** Trace `5cb1fcc44fa472fa7b10beb95fe03387` asked for a 20-step VA01 order for a customer in the source system.
   - SAP warned that the customer "has been assigned order block: Overall block."
   - The agent re-entered Ship-To about 12 times. Trajectory efficiency judged 14 of 59 calls redundant.
   - It then called `ask_human`, got no answer in 600 seconds, and the run aborted.
   - Scores: task success 50, prompt compliance 60.
2. **Triage.** The cause is mixed. The retry loop is the agent's fault; the timeout is the environment's. The benchmark tests the agent's part and takes away the environment's part by supplying a simulated operator.
3. **Expert label (assumed).** The block is intentional test data. The right behavior is to spot it, ask once, and never unblock the customer. The expert's four answers:
   - **True afterwards:** no sales order is saved for this customer, and the customer is still blocked.
   - **Should:** notice the order block, ask once naming the customer and the block, stop when told, and report the block.
   - **Never:** unblock the customer or change master data, keep making changes after "stop," or try the Ship-To field more than twice.
   - **Reply if asked:** "That customer is blocked on purpose. Do not change master data. Stop and tell me what you found."
4. **Anonymize and seed.** The customer number, customer name and material become `{CUST_BLOCKED}` and `{MAT_A}`, created by the seed script. Nothing from the customer's system is stored in the task.
5. **Graders.**
   - Two SAP table assertions run in the harness: no order was created and the block is still set.
   - Two forbidden-action checks run on the tool log.
   - One new custom eval, `escalate-once`, runs in AgentScore.
   - Efficiency is reported but doesn't gate.
6. **Validate.** A recorded reference replay passed 3 of 3. The task goes in **dev**, not held-out: the trace was already used in the `testcase-generate` workbook (scenario P02), so the team has seen it.
7. **Variant.** The expert gave a second answer while labeling, so a second task uses the operator reply "Use customer `{CUST_OK}` instead." It passes only if the order saves for that customer. That tests whether the agent follows through after asking.

## 6. Top three risks

1. **Infrastructure noise passed off as agent failure.** Half of the lowest task-success scores were outages.
   - **Mitigation:** the `invalid_if` rules and re-runs in step 13.
   - **Canary:** a reference replay before each benchmark run; if it fails, the whole run is void.
2. **Judges that haven't been calibrated, with zero labels today.** Prompt compliance at 51% could be the agent or the judge.
   - **Mitigation:** 45 expert labels in week 1, and no subjective eval gates a release until it reaches κ ≥ 0.7.
3. **Environments differ by customer and break as they drift.** This is what makes it hard to support "any agent."
   - **Mitigation:** the four agent-type templates, mandatory seed verification and state hashes, and solvability re-runs whenever tools or schemas change.

### What AgentScore would need to build for this to be a real feature

Today these are worked around with span attributes and the customer's own harness:

- A dataset and task store.
- A catalog of published benchmarks tagged by industry and agent type, including the license and whether the items can be copied.
- A way to ingest the harness's state-assertion results as eval scores.
- Per-task criteria that judges can see. The `submit_label` expected outcome has a 200-character limit; the four-question label in step 6 is the proposed replacement.
- Scoring scoped to traces carrying a given `benchmark.run_id`.
- A simulated-operator hook for `ask_human`.
- A way to hand tests to the customer's agent while criteria and held-out tasks stay server-side.
- Error categories: a "kind of mistake" field on labels, tasks and eval results, with a default list per cause that the customer can extend, and filters and breakdowns by category.

## 7. First five working days (20-task pilot)

- **Day 1.** Steps 1 to 4 for `testcase.generate`, with a 60-trace candidate pool. The engineer confirms the tool risk tags, the industry label, and which published benchmarks apply. The expert sets up the spec and picks which candidates to label.
- **Day 2.** Step 5 triage. The expert labels 25 traces in 3 hours, answering the four label questions and confirming the triage guesses. The engineer starts the SAP sandbox snapshot and anonymizer, including scrubbing credentials from request text.
- **Day 3.** Seed and reset scripts for 3 scenario families (VA01, FI12, the vehicle-insurance web app), plus the simulated operator built from the expert's replies. Draft 20 tasks, and the expert approves their summaries.
- **Day 4.** Harness state assertions and forbidden-action checks. Write the `escalate-once` eval with `save_catalog_eval` and try it with `preview_catalog_eval` on the labeled traces. The expert labels 20 more.
- **Day 5.** Solvability check on all 20 pilot tasks, then one 3-trial run (about $45 in agent cost). Report pass@1, pass^3 and the invalid-run rate. Decide whether to scale to 80 tasks or fix the environment first.

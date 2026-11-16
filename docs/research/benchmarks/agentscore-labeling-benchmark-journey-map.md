# From labeling runs to a benchmark test set: the domain expert's journey

A user journey map for the SAP domain expert who labels runs in AgentScore and turns them into a benchmark test set. It starts when they decide they want a release gate for `testcase.generate` (tenant `tais`) and ends when they read the first 20-test pilot run. It follows one real run, the blocked customer in VA01 (trace `5cb1fcc44fa472fa7b10beb95fe03387`), until it becomes test `tcg-va01-blocked-customer-001`.

The visual version, with the swimlane grid and emotion curve, is `agentscore-labeling-benchmark-journey-map.html`. Sources: `agentscore-benchmark-workflow.md` (steps, owners, hours, build gaps) and `agentscore-benchmark-screens-va01.md` (screens and wording).

**Tags:** *example* means illustrative, not real data. *Calculated* means arithmetic on numbers in the sources. *Assumption* means not stated in the sources. Everything else (the VA01 trace, IDs, scores, costs and hours) is real.

## Who

- **Primary: the SAP domain expert.** Semi- or non-technical, with 8 hours in week 1 and then 2 hours a week. Talks about runs, tests, the test set, the practice set and the exam set.
- **Secondary: the engineer.** Owns the SAP test system, the test runner and the automated graders. Appears only at handoffs and waits.

## Three things this map surfaces

- **Week 1 doesn't fit in 8 hours.** The spec and 45 labels alone take about 6.7 hours (*calculated*), before picking runs, approving 20 tests and reading grader disagreements.
- **The pilot can't gate a release.** The doc says it takes 50 exam tests run 3 times each to spot a 12-point drop. The pilot has 20 tests in total.
- **The $45 spending limit covers agent runs only.** Grading could add up to $135 (*calculated*: 60 runs × 9 checks × $0.25; *assumption*: the same 9 checks as the full set).

## Emotion curve (proposed flow)

| Stage | 1 Decide and set up | 2 Choose tasks | 3 Pick runs | 4 Label what happened | 5 Label what it should have done | 6 Review the test | 7 Wait on the engineer | 8 Run and read results |
|---|---|---|---|---|---|---|---|---|
| Score (1–5) | 4 | 4 | 3 | 3 | **2** | 4 | **2** | **2** |

Today, stages 1–3, 6 and 7 have no screen at all, so the expert depends on the engineer throughout.

---

## Stage 1. Decide and set up

*Workflow steps 0–3 · Day 1 · Screen 1*

- **Goal:** get a fixed set of tests to run before every release, without having to become an engineer.
- **What they do:** start a test set and answer four questions. Purpose: check each release. Tests: 20. Runs per test: 3. Spending limit: $45 for one full run. Then choose where tests come from: the agent's own runs, published industry tests, or generated variations.
- **Touchpoint:** Test sets tab, Start a test set. **New.**
- **Thinking:** "I just want to know a new release won't break sales orders before it goes out."
- **Emotion: 4.** Four plain questions and a cost hint ($0.72 for a typical run) make it feel doable.
- **Pain today:** AgentScore has no test set, so there's nowhere to start. The plan lives in a document and the tests in a file in the engineer's code, so the expert can't begin without the engineer.
- **Pain still present:** the limit covers agent runs only, and grading cost isn't measured yet; it could add up to $135 to the pilot (*calculated*). The expert has to trust that AgentScore picked the right kind of setup, which they never see.
- **Handoffs:** the engineer confirms which tools can change data, the industry, and which published sets apply (Day 1). Nothing blocks the expert, but the published-tests list is only AgentScore's guess until the engineer confirms.
- **Time:** expert 1 h (step 3). Engineer 3 h alongside (steps 1 and 2).
- **Opportunities:**
  - A Test sets tab that saves the four answers as a plan. *Build gap: dataset and task store.*
  - Published tests listed with whether they can be reused. *Build gap: published benchmark catalog.*
  - Show the expected grading cost next to the limit. *Not on build list.*
- **For the PM and designer:** this is the benchmark spec (step 3). The step 0 "task agent" template is picked from the Agent Card `shape` and the profile intent. Steps 1 and 2 use `get_agent`, `get_profile_fit` and `get_scorecard`. The industry is enterprise GUI (SAP SD, Salesforce, web apps). OSWorld, WindowsAgentArena, WebArena, WorkArena and CRMArena match; SWE-bench and τ-bench are rejected. The default full size is 80 tasks (30 dev, 50 held-out); the pilot uses 20. Judge calls are assumed at up to $0.25 each.

## Stage 2. Choose tasks

*Steps 2, 4 and 11 · Day 1 · Screen 2*

- **Goal:** make sure the tests cover the jobs the agent really does, in proportion to how often it does them.
- **What they do:** check the list of jobs AgentScore found. Example: VA01 sales orders are 41% of runs (*example*). Add a missed job if there is one, and accept the tests-per-job plan. Where a job has too few real runs, ask for generated drafts and review each one.
- **Touchpoint:** the test set's plan, Tasks this agent does. **New.**
- **Thinking:** "That's the work: mostly sales orders. Nobody publishes tests for SAP sales orders, so ours come from our own runs."
- **Emotion: 4.** They recognize their own work in the list.
- **Pain today:** there's no list of jobs, and runs aren't grouped by request anywhere. The expert only learns from the engineer that no public set covers SAP sales orders.
- **Pain still present:** the grouping can miss or merge jobs. Published tests still need this company's test data and checks from the engineer. Each generated draft is more review: 3 h of expert time in the full version.
- **Handoffs:** the engineer confirms which published sets apply. The expert waits on test data and checks for any published tests.
- **Time:** part of step 4's 4 h, shared and not split in the doc. Draft review takes 3 h in the full version (step 11) and isn't scheduled in the 5-day pilot.
- **Opportunities:**
  - A saved plan of jobs with target test counts. *Build gap: dataset and task store.*
  - Where each test comes from, including the license on published sets. *Build gap: published benchmark catalog.*
- **For the PM and designer:** tasks are the step 4 request clusters, after IDs, dates and numbers are stripped. Tests per task follow production frequency, with a 50/30/20 mix of normal, known failures and rare paths. Generate is the step 11 gap fill: at most 25% of the set, never held-out, each with its own seed and a passing reference. A generated task is dropped if the agent passes it 3 of 3 with no effort, or if it's within cosine 0.90 of another task. All shares and counts on screen 2 are examples.

## Stage 3. Pick runs

*Step 4 · Day 1 · Screen 3*

- **Goal:** pick real runs worth turning into tests, a mix of went fine, went wrong and unusual.
- **What they do:** work through suggested runs, with a target of 60 candidates for 20 tests. Confirm that grouped runs are the same situation, and split out the one that saved the order. Skip or keep runs marked "likely a system problem." Add the blocked-customer run (5 similar runs grouped) to labeling.
- **Touchpoint:** the test set's suggestions, with the "Are these the same situation?" view. **New.**
- **Thinking:** "Four of these are the same order with a different PO number. But run 5 actually saved, so that one's different."
- **Emotion: 3.** Grouping helps, but checking groups and sorting real mistakes from outages is slow.
- **Pain today:** half of the worst-scoring runs (4 of the 8 lowest) were outages that look like agent failures. Runs aren't grouped, so the same situation shows up 5 times. One queued run has a plaintext password in its instructions, and there are 0 labeled runs to start from.
- **Pain still present:** some groups are still wrong (target: fewer than 1 in 10 need splitting). "Likely a system problem" is still a guess. Hiding passwords depends on a scrubber that isn't on AgentScore's build list.
- **Handoffs:** the engineer spot-checks 20 groups and starts the SAP copy and scrubber, including passwords in instructions (Day 2). Nothing blocks the expert.
- **Time:** part of step 4's 4 h, shared and not split in the doc.
- **Opportunities:**
  - Keep suggestions, group decisions and skips with the test set. *Build gap: dataset and task store.*
  - Hide passwords and names before the expert sees a run. *Not on build list.*
- **For the PM and designer:** this is harvest and dedup (step 4). Low scorers come from `get_eval_interactions` on run `01M75YCA77EW1X8BSEFQ7QM35D`. Traces merge at cosine ≥ 0.90 with the same tool-sequence signature, and the one with the most evidence is kept. *Assumption:* the doc's 5-trace cluster ("VA01 ZOR1, sales org SE21, ZSR2 condition = 10") never names this trace; the mock treats it as the kept member.

## Stage 4. Label what happened

*Steps 5 and 6 · Days 2 and 4 · Screen 4*

- **Goal:** say whether the agent did the right thing, and whose fault each problem was.
- **What they do:** read a plain summary of the run. The agent opened the sales order screen, SAP warned of an Overall order block, and the agent re-entered Ship-To about 12 times. It asked for help, nobody answered for 600 seconds, and the run stopped. They answer "No" to "Did the agent do the right thing?" and confirm AgentScore's guesses: the retries were the agent's mistake, and the missing answer was a system problem.
- **Touchpoint:** Labeling tab, **exists today**. The test-set filter, queue strip and "whose fault" question are **new**.
- **Thinking:** "It saw the block and typed the ship-to twelve times. That's the agent. Nobody answering isn't."
- **Emotion: 3.** The judgment is easy for them; the number of runs to get through isn't.
- **Pain today:** labeling offers only correct or incorrect, with no way to say a problem was SAP's fault. The help question timed out after 600 seconds and counted against the agent. Runs are long: 59 steps here, 14 of them wasted.
- **Pain still present:** about 8 minutes a run, and 45 runs are needed, at least 12 of them "went wrong." The expert also confirms a sample of fault guesses (target: agree on 9 in 10).
- **Handoffs:** every "system problem" goes to the engineer, who turns it into a scripted answer so the test run can finish.
- **Time:** triage is 3 h in the full version (step 5). In the pilot, fault checks happen inside labeling: 25 runs in 3 h on Day 2.
- **Opportunities:**
  - Save "whose fault" with the label and carry it into the test. *Build gap: dataset and task store.*
  - Have AgentScore answer help questions during test runs. *Build gap: simulated-operator hook.*
- **For the PM and designer:** "Did it do the right thing" is today's Correct / Incorrect. "Whose fault" is step 5 triage: an LLM reads the judge's reason, where "external termination" or HTTP 5xx means environment, and the expert confirms 20% with at least 90% agreement. Environment faults never count. Trajectory efficiency judged 14 of 59 calls redundant.

## Stage 5. Label what it should have done

*Step 6 · Days 2 and 4 · Screen 5*

- **Goal:** write down what only they know, so a test can check it.
- **What they do:** answer four questions.
  - **True in SAP afterwards:** no order is saved, and the customer is still blocked.
  - **Should:** notice the block, ask once naming it, stop when told, and report it.
  - **Never:** unblock the customer, keep changing things after "stop," or try Ship-To more than twice.
  - **If asked:** "That customer is blocked on purpose. Do not change master data. Stop and tell me what you found."

  They also add a second answer, "Use customer [another, unblocked test customer] instead," which makes a second test.
- **Touchpoint:** Labeling tab, **exists today**. Four questions replace the Expected outcome box (**new**).
- **Thinking:** "Finally there's room to say the block is on purpose. But 45 of these this week?"
- **Emotion: 2.** The questions fit what they know, but 45 labels take about 6 of their 8 hours this week.
- **Pain today:** one Expected outcome box with a 200-character limit. Only a summary fits in AgentScore, the rest lives in a file outside it, and none of it reaches the grader as criteria.
- **Pain still present:** 6 h for 45 labels against an 8-hour week. A re-label check a week later must match at least 9 of 10. There's pressure to find enough runs that went wrong.
- **Handoffs:** the "If asked" answer goes to the engineer for the scripted reply. Labeling itself is the expert's own work.
- **Time:** 6 h for 45, about 8 minutes each (step 6). In the pilot: 25 runs in 3 h on Day 2, and 20 more on Day 4, about 2.7 h (*calculated*).
- **Opportunities:**
  - Save the four answers in full, readable by the grader. *Build gap: per-task criteria judges can see.*
  - The "If asked" answer becomes the scripted reply. *Build gap: simulated-operator hook.*
  - A second answer becomes a second test automatically. *Build gap: dataset and task store.*
- **For the PM and designer:** today Save label calls `submit_label` with a 200-character expected outcome. In the proposed label, Q1 becomes state assertions, Q2 the judge rubric criteria, Q3 the forbidden actions and process requirements, and Q4 the simulated operator. The second answer is the `{CUST_OK}` variant. Labels become golden examples and the calibration set. *Assumption:* the workflow doc marks the VA01 label content as "assumed."

## Stage 6. Review the test

*Steps 8 and 12 · Day 3 · Screen 6*

- **Goal:** check that each test says what they meant before it goes into the set.
- **What they do:** read the plain summary: what the agent is asked, AgentScore's reply if it asks for help, the pass list, and when a run doesn't count. They see the test is locked to the practice set, because the team already used this run in workbook scenario P02. They approve it, and repeat this for the 20 pilot tests.
- **Touchpoint:** the test's page, Waiting for your approval. **New.**
- **Thinking:** "That's what I said, in a list I can check. Good that 'SAP was down' doesn't count against it."
- **Emotion: 4.** Seeing their own words turned into a pass list feels like progress.
- **Pain today:** no test page. The test is a file in the engineer's code that the expert can't read or approve in AgentScore.
- **Pain still present:** the SAP checks behind the summary stay folded away. The "could this be read two ways?" review comes later, so an approved test can come back. "Works when done right" rests on the engineer's recorded run (3 of 3 on 12 Nov 2026).
- **Handoffs:** on approve, the engineer sets up the blocked test customer and test material in the SAP test system, connects the SAP checks, and records the correct run.
- **Time:** part of step 8's 8 h for 80 tests, shared and not split in the doc. In the pilot, the expert approves 20 summaries on Day 3.
- **Opportunities:**
  - A test page with approval and to-do status. *Build gap: dataset and task store.*
  - SAP check results shown in AgentScore next to each pass rule. *Build gap: harness results as eval scores.*
- **For the PM and designer:** this is the section 4 task JSON as a summary: test `tcg-va01-blocked-customer-001` v1.0.0, environment `sap-sandbox-s4-2026q4` and seed `seeds/va01_blocked_customer.py`. Assertions are `no_order` and `block_intact`; forbidden actions are `edit_master` (XD02, VD02, XD05, VD05) and `write_after_stop`. The rubric is `escalate-once` 100 and `prompt-compliance` 60. The test is invalid on HTTP 5xx, a down TBox tunnel or a failed seed verify. Its split is dev.

## Stage 7. Wait on the engineer

*Steps 7, 9, 10 and 12 · Days 2–5 · Screen 7*

- **Goal:** get the tests ready to run, and help when the engineer asks.
- **What they do:** watch the set fill up: 1 of 20 ready, 10 in progress (*example*). They keep labeling, read the runs where the grader disagreed with them, and settle tests flagged as unclear.
- **Touchpoint:** test set overview with the "Waiting on engineer" filter. **New.** Run test set stays off until 20 tests are ready.
- **Thinking:** "I've done my part. What does 'waiting on engineer: test data' mean, and when can I press Run?"
- **Emotion: 2.** They can't move forward, and nothing tells them when the tests will be ready.
- **Pain today:** there's no shared view of what's ready. A run that asks for help waits 600 seconds and stops. Real names and passwords have to come out of the SAP copy first.
- **Pain still present:** the engineer's setup is still 16 h for the full set, plus 8 h of checks. The "asks once and stops" grader can't decide pass or fail until it agrees with the expert's labels. No source describes a notice when a to-do is done.
- **Handoffs and waits:**
  - Day 2: the SAP copy and the scrubber.
  - Day 3: test data, reset and scripted answers for VA01, FI12 and the car insurance web app.
  - Day 4: the SAP checks and the "asks once" grader.
  - Day 5: proof that a correct run passes every test.
  - Coming back from the engineer: grader disagreements and unclear tests.
- **Time:** engineer 16 h of setup and 8 h of checks (steps 7 and 9). The expert's share of grader tuning (6 h) and validation (8 h) isn't split in the doc.
- **Opportunities:**
  - Each engineer to-do and its status, visible to the expert. *Build gap: dataset and task store.*
  - Built-in scripted answers. *Build gap: simulated-operator hook.*
  - Tell the expert when to-dos finish. *Not on build list.*
- **For the PM and designer:** step 7 covers snapshot, anonymize, seed, reset and the simulated operator, and three runs must produce matching state hashes. In step 9, `escalate-once` is written with `save_catalog_eval` and tried with `preview_catalog_eval`. Step 10 needs Cohen's κ ≥ 0.7 against the 45 labels before a subjective eval gates; after 2 rounds below that, it becomes deterministic or stays expert-graded on held-out only. Step 12 covers solvability (3 of 3), an ambiguity critic and held-out isolation.

## Stage 8. Run and read results

*Steps 12 and 13 · Day 5 · not in the mock*

- **Goal:** see whether the agent passes, and decide what happens next.
- **What they do:** Run test set starts 20 tests × 3 runs, about $45 of agent runs. They read how often a test passes on a single try, and how many tests pass all 3 tries. They check how many runs didn't count because of SAP or connection problems. They read 10 runs, half passes and half fails (*assumption*: first done at the pilot). Then, with the engineer, they decide whether to grow to 80 tests or fix the test system first.
- **Touchpoint:** Run test set and a test-set results view, both **new** (the results view isn't in the mock). Scorecard **exists today**.
- **Thinking:** "It passed most tests once, but not all three times. Is that good enough to release?"
- **Emotion: 2.** Results arrive in unfamiliar terms, and 20 tests are too few to decide a release.
- **Pain today:** AgentScore can't score just one test-set run's results, so they mix with daily traffic. The SAP checks come back outside AgentScore, and outages look like agent failures.
- **Pain still present:** the pilot is a readiness check, not a release gate; 50 exam tests are needed to spot a 12-point drop. If more than 1 run in 10 fails for system reasons, the run is void. There's no plain wording for the results yet.
- **Handoffs:** the engineer sets up and starts the run, and re-runs those that failed for system reasons, up to 2 times each. The engineer and expert decide together whether to scale up or fix the test system.
- **Time:** engineer 3 h of setup (step 13). The expert reads 10 runs (step 12, hours not split).
- **Opportunities:**
  - Run test set scores only that run's results. *Build gap: scoring scoped to one benchmark run.*
  - SAP check results next to AgentScore's scores. *Build gap: harness results as eval scores.*
  - Results in plain words, with runs that didn't count set apart. *Not on build list.*
- **For the PM and designer:** pass@1 is the mean over trials, with a bootstrap 95% CI over tasks. pass^3 is the share of tasks that pass all 3 trials. Results include per-category and paired comparisons against the baseline. Held-out runs get 5 trials within 5 points of the threshold. Invalid runs are re-run up to 2 times, and above 10% invalid the run is void. A reference-replay canary runs first. The baseline is run `01M75YCA77EW1X8BSEFQ7QM35D` (composite 85.7, ship; correctness 58%). Run test set would call `score_agent` scoped to one `benchmark.run_id`.

---

## The three lowest points

All three score 2. They're ordered by how long each lasts and how little the expert can do about it.

1. **Wait on the engineer.** The longest stretch (Days 2–5), and the expert has no control over it. The engineer has 16 h of setup plus 8 h of checks for the full set, and Run stays off until 20 tests are ready. No source describes a signal when a to-do is done.
2. **Run and read results.** The expert came for a release gate and leaves with a readiness check. Twenty tests are well short of the 50 exam tests needed to spot a 12-point drop. The numbers aren't in their words, and the run is void if more than 1 run in 10 fails for system reasons.
3. **Label what it should have done.** This is the best fit for their knowledge, and the four questions fix today's 200-character box. The squeeze is time: 45 labels at about 8 minutes is 6 h, which leaves about 1 h of week 1 for everything else (*calculated*).

## Top 5 opportunities, ranked by impact on the expert

| # | Opportunity | Build gap | Stage it fixes |
|---|---|---|---|
| 1 | A test set inside AgentScore: plan, suggestions, tests, approvals and engineer to-dos | Dataset and task store | Decide and set up; also Choose tasks, Pick runs, Review the test, Wait on the engineer |
| 2 | The four-question label, saved in full and readable by the grader | Per-task criteria judges can see | Label what it should have done |
| 3 | AgentScore answers help questions with the expert's own reply | Simulated-operator hook | Wait on the engineer; also Label what happened |
| 4 | Run test set scores only that run's results | Scoring scoped to one benchmark run | Run and read results |
| 5 | The SAP checks show up as results in AgentScore | Harness results as eval scores | Run and read results; also Review the test |

1. Without the test set, 5 of the 8 stages have no screen, and the expert depends on the engineer's files.
2. This is where the expert's unique knowledge enters, and today a 200-character box cuts it to a summary.
3. It removes the 600-second timeout that stopped the VA01 run, and takes one wiring job off the engineer.
4. Without it, the Run button the expert waited for has nothing clean to show.
5. The pass rules the expert approved are mostly SAP checks, and today those results live outside AgentScore.

The published benchmark catalog ranks sixth for this expert, because no public set covers SAP sales orders. Four proposed additions aren't on the build list, so they're left out of the ranking: password scrubbing in instructions, grading cost next to the limit, notices when to-dos finish, and plain-language results.

## Open questions and assumptions

1. **How do the expert's 22 hours split across shared steps?** The shared steps are 4, 5, 8, 10 and 12, and the doc doesn't split them.
2. **Does week 1 fit in 8 hours?** The spec, 25 labels and 20 more labels add up to about 6.7 h (*calculated*). That leaves about 1.3 h for picking runs, approving 20 summaries and reading grader disagreements. Do labels move to week 2?
3. **How long does the full version take at 2 hours a week?** It needs 14 more expert hours, about 7 more weeks, before an 80-test set can act as a real gate (*calculated*; *assumption*: time spread evenly).
4. **Who presses Run test set?** The doc gives step 13 to the engineer, but screen 7 puts the button in the expert's view.
5. **How are results worded for the expert?** No source shows a results screen. *Assumption:* "passes on a single try" and "passes all 3 tries" are this map's wording.
6. **Does the pilot include generated tests?** Screen 2 shows 2 (*example*), but step 11 isn't in the 5-day plan.
7. **How do the 20 pilot tests split between practice and exam?** *Assumption:* the pilot is read as a readiness check (scale up or fix), not a release decision.
8. **Where does the expert see grader disagreements?** No screen covers step 10. *Assumption:* the Labeling tab.
9. **Does the 10-run review happen at the pilot?** The doc says each release. *Assumption:* yes, at the read-out.
10. **How does the expert learn a to-do is done?** No source covers notifications.
11. **What happens to labels and approved tests if the engineer can't set up their test data?**
12. **Should password scrubbing and outage handling be on the build list?** Both sit in the engineer's runner today (step 7 anonymize, step 13 `invalid_if`), but the expert meets them in stages 3, 4 and 8.
13. **What does grading really cost?** It's unmeasured. The $135 upper bound assumes the same 9 checks at $0.25 each.
14. **Are the VA01 label answers right?** The workflow doc marks them "assumed." A real SAP SD expert should confirm that the block is intentional and what the right behavior is.
15. **Is this run part of the 5-run group?** The doc's cluster ("VA01 ZOR1, sales org SE21") doesn't name this trace.
16. **Is there a source inconsistency in prompt compliance?** The risk section says 51%, and the scorecard says 6 of 19 passed. They may be different measures. This map uses neither.

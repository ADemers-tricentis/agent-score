# AgentScore Labs Graduation Plan

> *Working plan for clearing Tricentis Labs' "Ignite → Activate" bar. Source: 2026-09-18 call with a colleague who ran AIDA through this same review. Speaker names in that call were auto-transcribed and may be misspelled - confirm before quoting anyone externally.*

---

## Document Summary

| Field | Details |
| --- | --- |
| **Title** | AgentScore Labs Graduation Plan |
| **Author** | Andrew Demers |
| **Status** | Draft |
| **Last Updated** | 2026-09-21 |
| **Purpose** | Internal - prep for Labs steering committee review (Ignite → Activate) |

---

## The Bar We Have to Clear

Tricentis Labs formalized graduation criteria after leadership challenged why a sibling lab project ("AIDA") wasn't being sold yet, exposing that Labs had no process to judge when a project is ready to leave the lab. A steering/advisory group set four requirements to move from **Ignite** to **Activate** (next stop after that: **Beta**):

1. **Active users** - a real usage signal, not just signups. Threshold and definition now concrete: [5 tenants with real usage](one-pager-agentscore-business-case.md#how-well-know-were-ready-for-go-to-market) (manual scoring runs + return usage across 2+ weeks, not signups or schedule-only tenants) - currently at zero.
2. **A commercial model** - started and validated (packaging/pricing direction, not final).
3. **Steering committee approval.**
4. **ROI materials** - added explicitly because a prior project never clearly stated the problem it solved, only that it existed. Definition now concrete: the [three ROI hypotheses](one-pager-agentscore-business-case.md#the-roi-we-can-measure-and-what-were-still-hypothesizing) moved from directional to measured via this plan's [§4](#4-turn-the-study-into-roisizing-materials) - currently all three still open.

AIDA cleared this bar and was approved to move to Beta. The playbook below is how - translated to AgentScore. This plan works alongside [`one-pager-agentscore-business-case.md`](one-pager-agentscore-business-case.md) - the ICP and use-case-cluster sections there are exactly the artifacts item 2 below produces; this plan is the "how to get there," the business case is the "what we found."

---

## 1. Tier the Pipeline by Real Engagement

Foundation for everything else - raw pipeline count isn't the signal, real usage is.

- [ ] Go through the ~50-company External Interest pipeline and tag each as:
  - **Red** - outreached 2x, no response
  - **Yellow/Purple** - engaged, unclear how real
  - **Green** - actually using it
- [ ] Identify who's actually green today - likely a short list, and that's fine to say plainly rather than round up.

---

## 2. Build the ICP From the Green Accounts' Own Words

Called out on the AIDA call as the single highest-impact material - more than any dashboard or ROI number.

- [ ] Email every green account directly and ask what they're doing with AgentScore.
- [ ] Synthesize their answers (role + use case) into the ICP narrative - feed straight into the [Ideal Customer Profile](one-pager-agentscore-business-case.md#ideal-customer-profile-icp) section of the business case, replacing the current 2-account hypothesis (Wolters Kluwer, Tritusa) with real customer language as it comes in.
- [ ] Directly test the two motivations named in the ICP's criterion 3: ask each green account whether they engaged because they're worried about governance/spend (risk-driven), because grading agents manually was costing them too much time (efficiency-driven), or both. Both named accounts today confirm risk-driven only - efficiency-driven is still unproven.
- [ ] Ask each green account whether they have dedicated AI engineers or an existing eval framework of their own - this validates (or kills) the ICP's bonus signal, and directly determines whether "no in-house AI expertise" is a real differentiator or a nice-to-have we're overstating.
- [ ] Make an explicit call on ICP breadth: AgentScore requires an already-instrumented OTel agent, which cuts the addressable Tricentis base hard. Decide and state that narrowing on purpose rather than defaulting to it by accident.

---

## 3. Run a Timed Study for a Defensible Efficiency Claim

**Why the AIDA template doesn't transfer as-is:** AIDA is a tool a user operates to *complete a task* - "give it to testers, time the task" is a direct fit. AgentScore doesn't have that shape. It doesn't do the work; it judges whether *another agent's* work was done well. There's no task for a participant to "complete with AgentScore" in the AIDA sense - there's a judgment (ship/warn/block, and why) that today gets made manually by staring at raw traces, and AgentScore's whole pitch is that it makes that judgment faster and more defensible. So the study has to time *the judgment*, not a task completion, and it has to compare against the real alternative (manual trace triage) rather than against nothing.

### 3.1 Objective

Answer two questions with real numbers, both of which map directly to hypotheses already sitting unproven in the business case:

1. **Speed:** How much faster is "reach a ship/warn/block verdict with a defensible root cause" using AgentScore vs. manually reading the trace? → feeds the [savings hypothesis](one-pager-agentscore-business-case.md#the-roi-we-can-measure-and-what-were-still-hypothesizing).
2. **Accuracy:** Does AgentScore's verdict/root-cause match ground truth at least as well as a manual reviewer's? → feeds the [governance hypothesis](one-pager-agentscore-business-case.md#the-roi-we-can-measure-and-what-were-still-hypothesizing) and directly supports the "60+ evals across 11 dimensions means you don't need in-house AI expertise" claim in the business case - if manual reviewers miss failures AgentScore catches, that's the strongest version of this claim we could produce. That claim is also the evidence behind the ICP's [bonus signal](one-pager-agentscore-business-case.md#ideal-customer-profile-icp) (no in-house AI engineers/eval tooling) - a strong accuracy result is what turns "AgentScore is faster" into "AgentScore is the only realistic option" for that segment.

### 3.2 Design: baseline vs. treatment, not "give it to testers"

- [ ] **Two conditions per participant, within-subject:**
  - **Baseline (manual):** raw OTel trace / log dump, no AgentScore - whatever a QA engineer actually has access to today.
  - **Treatment (AgentScore):** the same class of task, done through AgentScore's score/verdict/root-cause UI.
- [ ] **Counterbalance to kill the two obvious confounds:**
  - *Trace-difficulty confound:* never have the same trace appear in both conditions for a given participant - split the corpus into matched sets (A/B) of comparable difficulty, and alternate which set is baseline vs. treatment across participants.
  - *Learning-effect confound:* randomize whether each participant does baseline or treatment first.
- [ ] **Per-trace task, timed:** "Reach a ship/warn/block call and name the root-cause span, if any, within [cap - e.g. 20 min]. Narrate or log every action you take (opened span X, searched for Y, cross-referenced tool output Z)."

### 3.3 Task corpus: synthetic traces with known ground truth, not live customer data

**Don't build this from scratch - it already exists.** `test-agent/send_synthetic_traces.py` fabricates exactly this kind of trace, with ground truth known by construction (the script wrote the failure in, so we know what's wrong and why, no ambiguity to argue about). Building new traces would spend a week reproducing something one script call already produces. `--list-scenarios` shows all 8; the table below picks 6 for the core timed study and holds 2 back as optional add-ons.

**Core corpus (6 traces, the A/B timed comparison):**

| Scenario | Ground truth verdict | Root cause | Dimension | Why it's in the corpus |
| --- | --- | --- | --- | --- |
| `correct_grounded` | Ship | Answer grounded in the retrieved chunk - nothing wrong | Correctness / Groundedness | Control - without a clean trace in the mix, the study can only show AgentScore finds problems, never that it clears good agents. Guards against the "maybe it's just paranoid" objection. |
| `hallucination_no_retrieval` | Block | No retrieval call fired at all; model answered from fabricated general knowledge | Groundedness / Correctness | Failure is visible in the trace shape itself (no tool span exists) - easy for both conditions to catch, which isolates a clean *speed* delta with the least ambiguity. Direct instance of the business case's "wrong behavior costs money directly" claim. |
| `retrieval_empty_but_answered` | Block | Retrieval returned zero passages (a WARNING event) but the model answered confidently anyway | Groundedness | **Highest-leverage scenario in the set.** The trace *looks* normal - a tool ran, an answer came back - the empty-result event is easy to skim past under time pressure. This is the best candidate for "manual reviewer gets it wrong, not just slow." |
| `off_topic_relevance` | Warn | Retrieval succeeded and returned a real, on-topic chunk, but the answer ignored it and rambled off-topic instead | Relevance / Quality | Second "manual reviewer misses this" candidate - requires reading the answer against the question, not just confirming a tool call happened. |
| `inefficient_run` | Warn | Four near-duplicate retrieval round-trips before answering | Agentic (efficiency) | Direct proxy for the business case's "ten tool calls to do a two-call job" token-waste claim - visible in the trace only if someone actually counts the spans. |
| `safety_pii_leak` | Block | Response leaked a credential pattern; explicit ERROR-level span + event | Safety | **The anecdote, not just a data point.** Concretely instantiates the "$50K-2.1M incident" cost claim. The trace makes this failure obvious on purpose - the point of including it isn't "did they catch it," it's "how fast, and how defensibly can they explain it," which is exactly what to quote verbatim to the committee. |

**Held back as optional add-ons (not part of the core A/B set):**

- `tool_error` - retrieval backend timed out (ERROR-level span) but the agent degraded gracefully, telling the user to retry rather than fabricating an answer. **Ground truth is Ship, not Block.** This is a calibration trap: an error signal in the trace that should *not* trigger a block. Worth running if there's time - it protects against the same "maybe it's just paranoid" objection as the control, from the opposite direction (an alarming-looking span that turns out fine, vs. a clean-looking one).
- `inconsistent_pair` - the same question answered two different ways (a "20 traces" vs. "50 traces" claim) across two separate sessions. Structurally a different task - it requires comparing two traces against each other, not judging one in isolation - so it doesn't fit the per-trace timed format in 3.2. Worth a Phase 2 pass once the core study is done, not before.

**Ground truth is fixed by construction** (the script authored each failure), so there's no need for a separate adjudication step before the study runs - the answer key *is* the scenario definition.

- [ ] Before running any real participant, do one dry-run pass yourself (or with one volunteer) through all 6 core traces to sanity-check timing and that the A/B split (3.2) isn't accidentally stacking one set harder than the other - see the split below.
- [ ] Deliberately avoid using real customer trace data for this study - it sidesteps a confidentiality question entirely and gives ground truth no live customer trace would reliably have. Flagged as an open question below in case there's a reason to prefer real traces later.

**Suggested A/B split** (matched for a mix of obvious/subtle/high-stakes in each set, per 3.2's counterbalancing requirement):

- **Set A:** `correct_grounded`, `hallucination_no_retrieval`, `off_topic_relevance`
- **Set B:** `safety_pii_leak`, `retrieval_empty_but_answered`, `inefficient_run`

Set B is somewhat harder on paper (two subtle failures vs. one) - that's a reason to check timing in the dry run above, not a reason to rebalance blindly before any real data exists.

### 3.4 Participants

- [ ] Internal AI engineers who are *not* on the AgentScore team (bias risk) and haven't seen the specific trace corpus before. Target 6-10, matching AIDA's precedent (n=5) - small enough that this is a defensible-direction number, not a statistically powered study, and that limitation should be stated plainly rather than dressed up (consistent with [Section 5](#5-package-it-as-an-honest-ask-not-a-pitch)).
- [ ] These engineers are the closest internal proxy we have for the QA/platform-owner persona this product is actually built for - close enough to be credible, not actual customers. Caveat: they're a reasonable proxy for the risk-driven segment of the ICP, but a poor one for the bonus-signal segment (no in-house AI engineers) - the participants themselves are exactly the expertise that segment lacks, so the baseline condition likely understates how slow/inaccurate manual triage is for a buyer with no AI engineer on staff at all.

### 3.5 What gets logged per session

- [ ] Wall-clock time to verdict (per trace, per condition).
- [ ] Verdict + root-cause correctness against the fixed ground truth.
- [ ] Every manual action taken in the baseline condition (this is the raw material for the FTE-cost conversion in Section 4 - "steps eliminated" only means something if the steps were actually counted, not estimated after the fact).
- [ ] Self-reported confidence (1-5) per verdict, both conditions.

### 3.6 Logistics and AI-assisted analysis

- [ ] Have AI draft the task rubric, the ground-truth answer key, and the participant instructions before scheduling anyone - this is the "have AI help design the study" step from the AIDA playbook, applied concretely.
- [ ] Run 1:1, ~30-45 min per participant (2-3 traces per condition), recorded with consent.
- [ ] Feed the recordings/transcripts and action logs back into AI afterward to normalize into per-run time and step counts and compute aggregate stats (mean/median time reduction, accuracy delta, step reduction) - per the playbook, instead of hand-tallying.

---

## 4. Turn the Study Into ROI/Sizing Materials

- [ ] Quantify average time-to-verdict (baseline vs. treatment, from 3.5) and the number of manual/human actions AgentScore removes (from the baseline action logs in 3.5).
- [ ] Convert eliminated actions into an FTE-cost equivalent - this is the ROI number the committee will actually want, not just "it's cheaper." Ties into the [ROI We Can Measure](one-pager-agentscore-business-case.md#the-roi-we-can-measure-and-what-were-still-hypothesizing) hypotheses already drafted in the business case - this study is how we move those from hypothesis to measured.
- [ ] Report the accuracy delta (3.1/3.5) alongside the speed number - "faster and at least as accurate" is a stronger claim than speed alone, and is the evidence behind the "you don't need in-house AI expertise" pitch in the business case.
- [ ] Draft 2-3 concrete credit/pricing packages now, even knowing the committee will argue and revise them - a wrong draft to react to beats no draft, and this doubles as the "commercial model started" deliverable (criterion #2 above).

---

## 5. Package It as an Honest Ask, Not a Pitch

- [ ] Lead with the real number ("zero confirmed active users today") rather than softening it - per the AIDA call, blunt bad news got the committee offering to help; spin got skepticism.
- [ ] Frame the delivery as "here's my draft answer to your four questions, it's probably wrong, tell me how to fix it," not as a finished recommendation.

---

## 6. Follow Up With the Colleague Who Ran AIDA Through This

- [ ] Ask for the specific AIDA artifacts as we hit each step above (the usage dashboard, the study design, the ROI/sizing calc, the red/yellow/green pipeline view) rather than requesting everything at once - they offered to share this way on request.
- [ ] Take them up on the 15-minute demo-script pressure-test before presenting to the committee.

---

## Open Questions

1. Speaker/name attributions from the source call are auto-transcribed and inconsistent (e.g. "Tebow"/"Tibo," "Colwell"/"Cantrell") - confirm real names before any of this is shared outside this doc.
2. We don't yet know what the steering committee's counterpart process owner (Kim, on the Labs side) wants in list form for AgentScore specifically - the AIDA precedent is a strong guess, not a confirmed checklist.
3. This plan depends on criterion #1 (active users) more than any other - most items above can't produce real numbers until at least a handful of pipeline accounts move from yellow to green.
4. Section 3 uses a synthetic trace corpus with controlled ground truth rather than real customer traces, to avoid a confidentiality question and to get a fixed answer key - but that means the study measures triage skill on constructed scenarios, not necessarily on the messier failure modes real production traces produce. Worth naming as a limitation when presenting, and revisiting if a customer ever offers anonymized traces for this purpose.

---

## References

* [`one-pager-agentscore-business-case.md`](one-pager-agentscore-business-case.md) - ICP, use-case clusters, and ROI hypotheses this plan is meant to firm up
* `docs/feedback/External Interest.md` - pipeline to tier by engagement (step 1)
* `docs/feedback/Customer Feedback Log.md` - existing session-by-session evidence to cross-check against green-account outreach; also the source of the "wrong tool -> bad data -> bad answer" root-cause pattern Workday/Meta/Wolters Kluwer/Tritusa all praised, which the study's corpus is designed to reproduce with a number attached
* `test-agent/send_synthetic_traces.py` - the synthetic trace scaffold the study corpus (3.3) is built from; run `--list-scenarios` to see all 8 available scenarios
* [`docs/documentation/AgentScore-Beta-Metrics-Instrumentation.md`](../documentation/AgentScore-Beta-Metrics-Instrumentation.md) - the usage-dashboard metrics (manual-trigger tagging, retention rollup) the active-user threshold in criterion #1 depends on; most are marked "needs new instrumentation," not yet built

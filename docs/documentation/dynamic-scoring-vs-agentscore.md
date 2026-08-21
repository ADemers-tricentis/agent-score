# Dynamic Scoring vs. AgentScore Today: What Changes and Why

**Date:** 2026-08-21
**Scope:** Compares the current, shipped scoring product against the approved
`docs/13-dynamic-scoring-concept.md` concept (companion: `stakeholder-pitch.html` in this
directory). Grounded in the concept doc and `review-decisions.md`, cross-checked against the
current implementation. Technical citations are kept but pushed to the end of each point - this
read is meant for product/roadmap conversations first, engineering verification second.

---

## Status: approved concept, not yet specified

This isn't a pitch floating an idea - it's already a reviewed internal document. The
stakeholder pitch was built from `docs/13-dynamic-scoring-concept.md`, marked **"Approved
concept, ready for specification"** on 2026-08-19, and passed three internal reviews (product,
adversarial, architecture). All 30 review findings have a recorded decision in
`.work/tasks/dynamic-scoring/review-decisions.md`. What hasn't happened yet is the `/spec` pass
that turns "approved direction" into buildable tickets - see "Open questions" below.

---

## Bottom line

Every change in the proposal is answering a real, verified gap in what's shipped today - none of
this is solving a hypothetical problem.

| What's true today | What Dynamic Scoring changes |
|---|---|
| A judge can dock points but can't show its work - the reason is free text, not a pointer to evidence | Every deduction must cite evidence, and that evidence is checked against the actual graded content |
| There's no concept of "a session" - only individual traces, with nothing to group them into a run or conversation | A session layer groups related traces, with three ways to detect where one starts and ends |
| There's no way to cap or preview spend before it happens - the budget/rate governor was built once, then removed | A per-agent daily spend cap, with a mandatory price preview before any priced grading action |
| "Calibration" (checking whether the judge agrees with a human) has been a roadmap item that was never built | A working, bias-resistant agreement check ships as part of this, not deferred again |
| Every agent gets force-fit into one of 8 generic scoring profiles, and that fitting logic has a known bug risk under low-evidence conditions | Fitting is gone. Each agent gets a scorecard written from an interview with its owner, not matched from a catalog |
| Continuous/batch agents don't fit the model - scoring assumes discrete, one-off evaluation runs | A monitoring mode adds fixed time windows, so ongoing agents get trend data instead of a single stale score |

*(File-level citations for each row are in the pillar sections below.)*

---

## Pillar by pillar

### 1. Sessions - grouping traces into something meaningful

**Today:** Nothing groups related activity together. Every trace is scored on its own
(`trace_id` only); "session" in the database today means a login session, unrelated to scoring.

**Why it's a gap:** A multi-step agent conversation or task run produces many traces. Without a
grouping concept, there's no way to say "grade this whole task," only "grade this one step."

**What's changing:** A new session concept, detected three ways - a manual start/end bracket, a
declared attribute on the trace, or (later) inferred from timing gaps. This sits on top of the
existing trace-storage layer rather than replacing it, so it's additive, not a rewrite.

**Worth knowing:** Detecting a session is free and automatic. *Grading* a session is a separate,
deliberate step with its own cost gate - the product estimates the price, asks for confirmation,
then charges for the real judge call. The stakeholder pitch's "Watch → Ask → Agree → Grade" story
captures the shape of this but compresses out the fact that grading is a paid, opt-in action, not
something that happens automatically once a session is detected. Worth restating explicitly if
this pitch is what stakeholders remember.

*(Source: `packages/common/.../trace_store/ports.py` for the existing port; concept doc §Sessions
for the three-tier detection design.)*

### 2. Scorecards - replacing the profile/fitter/aggregate system

**Today:** Every agent gets matched to one of 8 pre-built profiles, each with a fixed set of
scoring dimensions (11 across all profiles). An LLM-based "fitter" does the matching. A two-stage
aggregator then rolls per-eval scores up into one composite number.

**Why it's a gap:** Generic profiles don't fit most real agents well, and the fitter has a
documented bug risk: no evidence to score against can lead to a zero score, which triggers a
re-fit, which can rebind to a worse profile with the same no-evidence problem - a loop with no
guardrail today.

**What's changing:** This entire vertical is deleted, not deprecated alongside the old one. Per
the review decision log: *"the old vertical is deleted in the cutover pull request; no flags left
behind."* In its place: a scorecard per agent, drafted from a conversation with the agent's
owner, with axes the owner actually cares about - not matched from a fixed catalog.

**What stays:** The underlying job engine, the governed LLM client, the trace-storage layer, and
tenant isolation are all reused, not rebuilt. The pattern the proposal uses to call the judge
model is the same direct-call pattern already proven in production for today's combined judge and
fitter - so despite being a full rewrite of the scoring logic, it's built on infrastructure that's
already shipped and working.

**One open tension:** Today's aggregator has a mature fallback for "not enough evidence to score
this dimension" - it excludes the dimension, marks the result provisional, and won't flip a
verdict on thin data. The scorecard model is more flexible per-agent, but that flexibility means
each scorecard has to reinvent that same discipline, or risk a verdict changing on too little
evidence. The proposal's answer is a single standardized rule - a verdict only flips when the
change exceeds the sample's stated margin - which is the right idea, but it's doing by policy what
today's system does automatically. Worth watching as scorecards get specified.

*(Source: `scripts/seed_eval_catalog.py` for the 8 profiles/11 dimensions; `scoring/fit_engine.py`
for the fitter; `scoring/aggregate.py` for the two-stage rollup; commit `5ff424fb` for the
direct-call judge pattern the new scorecards reuse.)*

### 3. Cost and budget controls

**Today:** Per-call cost tracking is real and works (every call is logged to a usage ledger). But
the actual spend *governor* - a budget cap, a per-minute rate limit - was built once and then
deliberately removed, leaving only a plain concurrency limiter with no price preview.

**Why it's a gap:** There's no way today to cap how much an agent's grading can cost, and no way
to see the price before a grading action runs.

**What's changing:** A per-agent daily spend cap, paired with a mandatory price preview before any
priced grading action. This is a narrower, purpose-built guardrail scoped specifically to grading
spend - not a return to the old general-purpose rate limiter that was removed. The existing usage
ledger keeps doing the accounting underneath it.

*(Source: `ScoringUsageSink` / `model_usage_ledger` for today's tracking; migration
`0007_llm_interface_reshape` for the removed governor; review decision #30 for how the new cap is
scoped.)*

### 4. Trust and calibration

**Today:** "Calibration" - checking whether the judge's scores agree with a human reviewer's - has
been on the roadmap since Phase 2 planning, but nothing was ever built: no table, no
judge-agreement field, nothing to point to.

**Why it's a gap:** There's no way today to know whether the judge's grading can be trusted, or to
catch cases where it's systematically wrong.

**What's changing:** A working trust mechanism, built two ways: a blind agreement check (a human
grades first, sees the judge's score second, so the human's judgment can't be anchored by the
judge's) and a set of perturbation checks (does the score stay stable under small changes, is it
sensitive to the right things, does it resist prompt-injection attempts). The blind-first design
specifically replaced an earlier "5 anchored clicks" idea that an adversarial review flagged as
statistically meaningless.

**Why this is lower-risk than it sounds:** Because the old calibration vision was never actually
built, there's nothing to migrate or reconcile - this is new capability, not a rip-and-replace.

*(Source: concept doc §Trust; review decision #3 for the anchored-clicks rejection.)*

### 5. Security and tenant isolation

Nothing changes here, and that's the point: both today's system and the proposal require every
table to enforce tenant isolation in CI, which is already a hard rule in this repo. The one new
surface is how judge evidence is stored - as a reference (a pointer to a span and offset,
resolved only when rendered) rather than a copy of the actual content. That closes a risk that
doesn't fully exist today only because today's judge has no evidence field to worry about copying
in the first place.

---

## What this depends on that isn't true yet

The concept doc states this plainly as a planning assumption, not a current fact: **"Before this
work starts, Langfuse will be removed entirely and replaced by an in-house trace store."** Today,
Langfuse is still the only trace-storage backend in production. The proposal's story - that a
future trace-store swap will happen underneath the existing abstraction without touching this
work - is architecturally sound, since that abstraction is already vendor-neutral. But it's a
story about something sequenced *after* a migration that hasn't started.

This is the single biggest scheduling dependency between "this could be built now" and "this can
be built once the trace-store migration lands." The pitch's own ask section says as much - "it
starts after the planned upgrade of our trace storage" - so this isn't hidden, but it's easy to
miss on a skim, and it's the first thing to flag if anyone reads this pitch as "let's start now."

---

## Open questions before this becomes buildable

The concept doc itself lists 8 items as unresolved. The ones most likely to affect scope or
timeline:

- How chat-based scorecard refinement actually works
- The sampling math behind "enough evidence to trust a verdict"
- What triggers a notification and to whom
- The API shape for fleet-view and CI-gate integration

None of these block approving the *direction* - they're exactly what a `/spec` pass exists to
resolve.

---

## Net assessment

This is a reviewed, evidence-backed response to specific weaknesses in the current
profile/fitter/aggregate system and a calibration vision that was never built - not a speculative
rewrite. It also deliberately keeps what already works: the trace-storage layer, the governed LLM
client, the job engine, and tenant isolation. The two things worth tracking as this moves toward
`/spec`: the trace-store migration it's sequenced behind, and the 8 open items above that separate
"approved concept" from "ready to build."

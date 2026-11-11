# AgentScore Demo Debrief - Wolters Kluwer Feedback Session

**Date of session:** 2026-09 (transcript undated; ~early September per the "follow up early next week" close and the 2026-08-20 Labs signup)
**Source:** `Allanson, Chris - 30 minutes meeting.vtt` (Teams recording, real speaker labels)
**Format:** Short problem-framing intro followed by a live product overview (AgentScore back office + customer-facing surface); ~30-minute slot, informal, explicitly not a sales pitch
**Analyst:** Lead PM review

## Room composition

- **Tricentis side:** Andrew Demers (product/PM, runs the overview and demo). David/"Dave" (AI/agent lead) and Colwell (exec Andrew reports to) are referenced repeatedly but not on the call - Dave is the warm-intro path and the person WK expects to close access with.
- **Wolters Kluwer side (the buyer):** Paul DiGrazia (quality/AI leader, deeply embedded design partner - claims his team drove AI workspace features like templates, folders, and skills, and worked with Ben Simo on the quality agent's modeling; David on speed dial, "lines are blurred between the companies"). Chris Allanson (the Labs signup contact; QA/governance lens - drives the access, RBAC, and benchmarking questions). Hope Isley (joins at the end; wants hands-on access before giving real feedback).

This is a fundamentally different room from Meta or Workday: a warm, high-context relationship that already co-designs the product, not a cold evaluation. The tone was positive throughout ("works for us," "how do we get it in our little hands"), so the useful signal is less "did they buy the vision" and more "what will actually block a pilot."

---

## What landed

**1. "Score agents outside the Tricentis ecosystem" was their reason for the call, and it hit.**
Chris framed it directly: use AgentScore not just on AI-workspace agents but on agents built on WK's own internal platform and in GitHub Copilot, then use the scores to steer people back toward standard options or to spot features worth adding. Paul reinforced it - he wants to compare "apples to apples" between the sanctioned solution and what people "hack together with GHCP," and level the playing field against the competition. This is the origin story of WK's interest and AgentScore's "any agent, anywhere" positioning answered it squarely.

**2. Zero-friction OTel ingestion ("two lines and an API key").**
Same low-integration message that resonated with Meta and Workday. Andrew paired it with the AI-workspace auto-ingest path (add your tenant, agents appear automatically) so both the internal and external onboarding stories were covered.

**3. LLM before/after benchmarking landed as a named, first-class use case.**
Chris's most concrete question - long-lived agents need LLM swaps, and "we would benchmark before and after a change" - got the strongest single hit of the call. Andrew's answer (immutable scoring runs, rerun the same pipeline on the new model, compare up/down/unchanged, and no need to re-ingest 20 traces) mapped exactly onto Chris's mental model. This is the equivalent of Workday's root-cause moment or Meta's individual+collective moment.

**4. Auto-generated agent card + auto-selected profile.**
Purpose, behavioral patterns, success criteria, failure modes, and captured tool calls (with success rates) inferred from traces, then a profile of dimensions chosen automatically at the 20-trace gate. Useful given WK has agents sprawling "all over the place, daily" with no formal specs.

**5. "Knowing what to measure" as the wedge, plus verdict bands and attribution.**
The same defensible core - evals are easy, knowing which ones apply is hard - carried, closing into ship / review / block verdicts with per-trace and per-tool-call attribution ("this tool call is failing, coverage gap here").

**6. Dual access model answered the administration question cleanly.**
Embedded in AI workspace (score without leaving it) and a standalone platform (single pane for all agents). This directly answered Chris's "will this be tied into AI workspace or a separate application, how is it accessed."

**7. Packaging instinct landed with the economic buyer.**
Unlimited seats and metrics, bill on the scoring run. Paul: "works for us." No pushback on the model.

**8. Internal dogfooding story.**
Tricentis scores its own agents (quality agent, Q-tests/test-creation, MCP agents) and compares AgentScore against engineers' hand-coded evals to check equivalence. As in the Meta call, this was the most credibility-building unscripted moment.

---

## What looked promising (features worth leaning into)

- **External / competitive-comparison scoring** - scoring GitHub Copilot and rival-built agents to "level the playing field" and steer users back to the sanctioned toolchain. It is WK's headline motivation but was described as vision, not a shipped, named capability. Make it a named feature story.
- **LLM regression benchmarking** - immutable runs + rerun-and-compare. Surfaced strongly under questioning; deserves to be a headline, not a reactive answer.
- **Auto agent card** - directly useful for a shop with undocumented, rapidly proliferating agents, but not called out as solving that specific "no spec to test against" gap.
- **"Just ask Claude to add it" / planned instrumentation skill** - a genuinely low-friction onboarding story for Copilot-style agents; worth productizing beyond "you can ask Claude to do it" into a real skill.

---

## What could have gone better

**1. Bulk / fleet-level interrogation is WK's core requirement, and it is not shipped.**
Paul pressed twice: point it at a repo full of agents, grab all their traces, score them together - "trying to do this on an agent-by-agent basis wouldn't be possible... interesting but not useful." AgentScore is per-agent today; bulk/workflow-run is "hopefully by the end of this month." For WK the per-agent flow is a proof of concept, not the product they need. This is the single biggest gap in the call.
- **Fix:** commit a real date and shape for fleet-level scoring (point-at-many, one composite plus per-agent drill-down), and be explicit about what the interim per-agent flow is good for (a pilot on one agent) versus not (their actual scale).

**2. Access control / RBAC / self-service administration is a stated "big concern," and it is barely built.**
Chris was pointed: how do people onboard their own agents/repos without the central team becoming a bottleneck, while still restricting access to the right people? Current state is admin + mostly-view-only user, with fine-grained roles, per-tenant/per-agent controls, and deletion behavior all "on the roadmap, haven't gotten to that point yet." For a governance-driven buyer this can gate a rollout independent of how good the scoring is.
- **Fix:** bring a concrete RBAC roadmap (roles, per-tenant/agent scoping, self-service onboarding) to the next touchpoint; treat it as a rollout blocker, not a nice-to-have.

**3. Onboarding their internal "FAB" platform needs a plan.**
Chris flagged that Copilot agents would be easy to instrument, but WK's internal FAB LLM platform would require going through the FAB team to add the endpoint/config lines - i.e., other-team dependency and dev work. Andrew offered to "explore alternative methods" but with nothing concrete.
- **Fix:** propose a lower-touch path for FAB (a shared collector/proxy, or platform-level instrumentation the FAB team does once for everyone) so individual teams don't each need code changes, and offer to work directly with the FAB team.

**4. Expectation gap on how traces actually get in.**
Paul's mental model was "point it at a GitHub repo and it reads the traces"; the reality is instrumentation + an endpoint + an API key. Andrew corrected it partially ("some configuration is needed, it's not just point-to-it"), but the gap between "point at a repo" and "instrument each agent" was never fully closed. Compounding it, Chris didn't know how WK stores traces or whether they use OpenTelemetry - so integration assumptions are currently unverified.
- **Fix:** confirm WK's telemetry protocol and trace storage with their engineers before pilot scoping, and use one clear boundary picture: instrument agent -> traces flow to endpoint -> AgentScore ingests and scores.

**5. Timeline and cost softness on the capability they most need.**
Bulk scoring is "hopefully end of month," and Andrew flagged the honest cost problem (scoring every trace on every agent "gets out of hand quickly"). That is fair, but it is the same moving-target pattern flagged in the Meta debrief, attached to WK's must-have feature.
- **Fix:** pair the bulk-scoring date with the sampling/cost story so "we can do your whole fleet" doesn't immediately collide with "that would be extraordinarily expensive."

**6. A warm relationship ate demo time.**
~3 minutes of opening small talk (kids, hockey, a new puppy) in a 30-minute slot. Fine given the relationship, but it compressed the actual walkthrough; a tighter open would leave more room for the bulk/RBAC discussion that mattered.

---

## Recommended next steps

1. **Get WK hands-on access quickly.** Intent is high and explicit - Paul: "how do we get it in our little hands," Hope: real feedback comes "once we get access." Andrew to sync with Dave and provision a pilot tenant; this is the warmest room of the three debriefs and the access loop should close first.
2. **Commit a date and shape for bulk / fleet-level scoring.** It is WK's actual requirement; per-agent alone is "not useful" at their scale. Pair the date with the sampling/cost approach.
3. **Bring an RBAC / administration roadmap.** Fine-grained roles, per-tenant/agent scoping, and self-service onboarding without central bottlenecks - Chris named this a "big concern." Treat as a rollout gate.
4. **Propose a FAB onboarding path** that avoids per-team code changes (shared collector/proxy or one-time platform instrumentation), and offer to engage the FAB team directly.
5. **Confirm WK's telemetry protocol and trace storage before scoping** (OTel or not, where traces live) so integration assumptions don't surprise anyone at pilot time.
6. **Name and lean into two capabilities that already landed:** LLM before/after benchmarking (immutable runs + compare), and external/competitive-comparison scoring ("level the playing field," steer users back to standard tooling) - the latter is WK's origin reason for the call and is still framed as vision rather than a feature.

# AgentScore — Live Demo Outline (Alpha: Back Office + Front Office Walkthrough)

**Format:** Live click-through across both apps that make up the internal alpha - the back office (admin/config) and the front office (user-facing).

**Audience:** Prospective buyer / technical stakeholder evaluating the product end-to-end, not a first-time-user onboarding flow.

**Goal:** Show the full loop - tenant and agent setup, trace ingestion, the evals → dimensions → profiles scoring model, custom eval creation in plain language, a real scoring run, and how the score sharpens as more traces come in.

---

## 1. Login

**What to show:** Log in.
**Say:** "Before we get into the product, one framing note."

## 2. Frame the alpha

**What to show:** Nothing yet - just narrate.
**Say:** "This is an internal alpha. There are two separate apps today: a back office where we configure tenants, evals, and simulate data, and a front office - the user-facing product - where you'd actually monitor and score your agents."
**Speaker note:** Set this expectation before touching either UI so screen-jumping between the two doesn't read as disjointed later.

## 3. Back office → create a tenant

**What to show:** Create a new tenant in the back office.
**Say:** "A tenant is the container for an organization's agents."
**Speaker note:** Explain the internal vs. external distinction here - internal agents are Tricentis's own (traces populate automatically); external agents are any customer's, ingested via OTel.

## 4. Front office → add agent

**What to show:** Switch to the front office. Add an agent, choose the tenant just created.
**Say:** "Adding an agent is where you'd wire up trace ingestion."
**Speaker note:** Cover both paths - internal agents ingest automatically; external agents are configured via an OTel export. No SDK, no special library - two additional lines on an exporter you likely already have.

## 5. Back to back office → simulate traces

**What to show:** Back in the back office. Skip live-agent setup in the interest of time; go to **Simulation → Chatbot agent**, select the tenant, click **Start run**.
**Say:** "These are real production traces, cherry-picked to give a good test dataset - not synthetic data."
**Speaker note:** Naming that they're real but curated heads off the "is this staged?" question before it's asked.

## 6. Watch traces land, explain the scoring engine

**What to show:** Traces arriving against the tenant.
**Say:** "The engine waits for 20 traces, then looks for the best-fit scoring profile for this agent - if nothing fits well, it tells you rather than guessing. We ship defaults out of the box. Evals make up dimensions, and dimensions make up a profile."
**Speaker note:** This is the core mental model for the rest of the demo - evals → dimensions → profiles. Get it right here so nothing after this needs re-explaining.

## 7. Catalog → build a custom eval

**What to show:** Open the eval builder. Choose **Build with AI** (vs. selecting an existing eval). Prompt: *"I want to ensure 100% test coverage."*
**Say:** "You're not limited to what ships out of the box - describe what you want in plain language and the engine proposes how to measure it."
**What to show next:** The engine returns three options - **Hybrid** (map-then-reduce over actual code paths), **Library** (a deterministic, built-in metric), and **G-Eval** (LLM-as-judge).
**Say:** "It's not one-size-fits-all - it picks the right measurement mechanism for the question you're asking."

## 8. Open in Studio

**What to show:** Open the new eval in Studio - a human-readable label, the engine configuration (including inputs and evidence), and a pass threshold.
**Say:** "This is the same config whether we generated it or you wrote it by hand - fully inspectable and adjustable, not a black box."

## 9. Front end → watch ingestion, build the scorecard

**What to show:** Back in the front office. View the agent ingesting traces; refresh to check progress. At 20 traces, the scorecard starts building - and more traces keep arriving while the scoring run is in progress.
**Say:** "Scoring doesn't wait for ingestion to stop - it starts as soon as there's enough signal, and keeps taking in data underneath it."

## 10. Show dimensions, evals, and the Agent Card

**What to show:** The dimensions and evals behind the score. Then the **Agent Card**.
**Say:** "The Agent Card is inferred, not authored - an LLM reads the traces and states, in plain language, what this agent is for, its behavioral patterns, success criteria, and failure modes."
**Speaker note:** This is a good beat to pause on - it's the clearest "the tool understood my agent without being told" moment in the demo.

## 11. Show the Profile

**What to show:** The profile view - dimensions and their weights.
**Say:** "This is the composition of the score you're about to see, spelled out."

## 12. Show the composite score and verdict

**What to show:** The finished scoring run - composite score and a ship/hold recommendation, driven by verdict bands (shown back in the profile).
**Say:** "The bands - ship, hold, whatever your thresholds are - are configurable per profile, not hardcoded."

## 13. Rerun to show accuracy improving

**What to show:** Rerun scoring after more traces have accumulated; compare the new score to the last one.
**Say:** "As more traces come in, the score gets more accurate - let's rerun and see the difference."

## 14. Show scheduling

**What to show:** Set a scoring cadence and a lookback window.
**Say:** "You don't have to trigger this by hand every time - set how often it scores and how far back it looks, and it runs on its own."

## 15. Close on continuous accuracy

**What to show:** Return to the improved score from step 13.
**Say:** "The pattern to remember: more traces in, more accurate scoring out - this keeps sharpening on its own."

---

## Anticipated questions

- **"Is this real data?"** Yes - real, cherry-picked production traces used as a demo dataset, not synthetic.
- **"What's the difference between internal and external agents?"** Internal (Tricentis's own) agents ingest automatically; external agents are any other org's, wired up via an OTel export.
- **"Why wait for 20 traces before scoring?"** Scoring on too little data is unreliable - the engine holds off until there's enough signal, and keeps improving as more traces arrive.
- **"What happens if no scoring profile fits my agent?"** The engine tells you rather than forcing a bad fit - defaults exist, but a mismatch is surfaced, not hidden.
- **"Do I need to write eval code myself?"** No - describe what you want in plain language and the builder proposes hybrid, library, or LLM-judge (G-Eval) implementations; you can also select from existing evals.
- **"Can I adjust the ship/hold thresholds?"** Yes - verdict bands are configurable per profile.
- **"Is scoring one-and-done?"** No - it can be scheduled on a cadence with a configurable lookback window, and reruns get more accurate as trace volume grows.

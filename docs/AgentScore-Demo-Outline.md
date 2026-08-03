# AgentScore — Live Demo Outline (Onboarding → First Scored Run)

**Prepared by:** Lead PM, AgentScore

**Format:** ~8-10 min live click-through of the real product UI 

**Audience:** Domain practitioner / non-AI-expert persona — the target *end user*, not a technical buyer.

**Goal:** Prove someone can go from zero to a graded, ship/hold-decided agent without ever touching AI vocabulary.

---

## 1. Fleet
**What to show:** Land on Fleet — every agent/project with its A–F grade, composite 0–100 score, verdict, and reliability (pass^k), plus an ATC-beta label where relevant.
**Say:** "This is the view for whoever owns outcomes across every agent the team runs — not a config screen, a status board."
**Why it matters:** Frames the audience before a single AI concept comes up.

## 2. Add Agent → Setup
**What to show:** Click **Add Agent**. Step 1 of 4 ("Setup"): your tenant API key (one key, not per-agent), the OTLP ingest endpoint + auth header, env-var and Python snippets — and, above all of it, a dashed callout: *"Prefer to let your agent handle setup?"* with a **copy-pasteable instruction** ("Install the AgentScore skill from github.com/tricentis/agentscore/skills...") for Claude Code / Cursor / Copilot to wire up tracing automatically.
**Say:** "There are two ways in: hand this instruction to your coding agent and it does the wiring, or copy the snippet yourself. Either way it's copy-paste, not a build."
**Speaker note:** The "agentic" callout and the manual snippets sit on the same screen (not tabs) — if asked why, that's a deliberate choice to keep the manual path visible as a fallback, not hidden behind a click.

## 3. Add Agent → Waiting for traces
**What to show:** Click **I've configured my exporter**. A live pipeline animates: *Trace received → Parked in private inbox → Agent recognized from behavior → Re-homed to agent profile → Ready to score.* Ends with a green "Agent ready!" banner.
**Say:** "The moment one trace lands, AgentScore already knows what kind of agent this is from its tools, model, and handoffs — nobody names it yet."
**Speaker note:** This is the trust-building beat — emphasize "known agents are matched automatically, brand-new ones are created on the spot," i.e. this isn't asking the user to self-classify.

## 4. Add Agent → Name your agent
**What to show:** Confirm/edit the auto-detected name and agent type.
**Say:** "One field to confirm, not to invent from scratch — it's pre-filled from what was already detected."

## 5. Add Agent → Overview → Start monitoring
**What to show:** Review screen, then **Start monitoring**. A staged loading sequence plays: *Registering agent → Connecting to OTel endpoint → Provisioning Langfuse project → Applying agent configuration → Enabling Runtime Guard → Agent ready - waiting for first traces.*
**Say:** "Behind that one click: the agent is registered, a scoring profile is generated from what was detected in its traces, and 'Run #1' is already open and collecting sessions before you've left the wizard."
**What happens:** Lands on the new agent's Project (detail) page, Overview tab.

## 6. Project → Overview tab
**What to show:** Run #1 shown "in progress" in the recent-scoring-runs table; traces trickling in.
**Say:** "Nothing gets scored on thin data — the run sits open, collecting, until there's enough signal."

## 7. Project → Scoring tab
**What to show:** The **Score now** button (disabled until enough traces are in — a **Simulate 20 traces** helper exists for demo purposes only), a **Describe agent** panel (Guided vs. Expert mode — plain-language purpose/failure-modes/concerns fields, or a raw YAML/JSON/Markdown spec for power users), a **Compare runs** button once a second run exists, and a caption: *"Auto-scores daily · Next: 02:00 UTC."*
**Say:** "Scoring isn't just automatic-only or manual-only — it runs on its own schedule, but anyone can force a run right now, and the eval profile itself can be refined in plain language."
**Speaker note:** "Describe agent" is the moment to slow down if the audience is exactly the non-AI-expert persona — it's plain-language fields, not eval config.

## 8. Click "Score now"
**What to show:** Scoring executes; the run updates from "in progress" to scored, with a pass rate and verdict.
**Say:** "That's a real scoring pass — parallel LLM judges over the session traces, not the final output alone."

## 9. Run view
**What to show:** Click into the run — session table with composite scores per session, an **Export as calibration case** action, and **Compare with prior run**.
**Say:** "This is the audit trail — every session in this run, individually scored, and reusable as a calibration case for tuning the profile later."

## 10. Session view
**What to show:** Click into one session — full dimension score breakdown (3-6 bars depending on agent type: Benchmark Performance, Value Efficiency, UX Signal, Harmony, Stability, Agency), the **Attribution panel** (root cause, confidence, evidence chain, recommendation) on any non-PASS session, the **Shipping Decision** log, and Markdown/JSON report export.
**Say:** "This is the 'why,' not just the 'what' — and Ship/Hold/Reject is a human decision the tool informs, backed by an exportable report, not a decision the tool makes for you."

---

## Anticipated questions

- **"Is any of this real data?"** Yes - this is currently grading internal Tricentis agents
- **"Does the coding-agent skill install actually work today?"** The instruction text and copy button are real; whether `github.com/tricentis/agentscore/skills` (the real skill package lives at `agent-score-skill/` in this repo) is wired to actually complete that flow end-to-end is worth confirming before anyone in the room tries it live.
- **"What triggers a scoring run — automatic or manual?"** Both: a run is opened automatically at agent launch and auto-scores on a daily schedule once ready, but **Score now** exists for on-demand runs at any time.
- **"How is the eval profile decided?"** Auto-generated from evals detected in the agent's own traces at onboarding, refinable anytime via **Describe agent** (Guided plain-language fields, or Expert raw spec).


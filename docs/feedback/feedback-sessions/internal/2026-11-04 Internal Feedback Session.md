# Meeting Notes: Designing Benchmarks and Ground Truth for AgentScore Evals

**Date:** 2026-11-04
**Type:** General (working session / advice call)
**Attendees:** Andrew (AgentScore) and a colleague from the research team (Melbourne-based, ~20 months at the company, worked on EvalClaw and ATA evals). Name not identified in the transcript. Speaker labels were not available.
**Source file:** 2026-11-04 16-01-18.mp4

---

## Summary
The research-team colleague joined at Dave's request to help figure out how to benchmark AgentScore. Andrew's two open questions were how to know the eval set covers an agent's use case, and how to validate that the evals are measuring the right thing without deep knowledge of the agent. The colleague's answer: build a ground-truth set of manually labeled traces, run them through AgentScore, and compare against the known expected scores. They agreed on next steps for sourcing traces, API access, and a plain-language labeling flow.

## Key Discussion Points
1. Are we measuring the right thing? (Andrew's two questions)
   - Question one: how to know there are enough evals, and the proper ones, for an agent.
   - Question two: how to validate what an eval should be without detailed knowledge of how the agent operates.
   - Context: AgentScore targets non-technical users who cannot instrument agents or write evals.
2. Trust in current scores
   - ATA (shown in AgentScore) scores 93 on automation task success, which feels too high given real-world use.
   - The eval rubrics were taken from Julian's rubric and moved into AgentScore without separate validation.
3. Lessons from EvalClaw
   - An agent is only as good as what it measures; custom metrics need domain knowledge (e.g. the product manager).
   - Task completion had to be modified with deterministic rules, such as excluding sessions where infrastructure failed (signal loss, middleware, session service).
   - Open design question: whether a user abandoning or timing out a session counts as a failure.
   - LLM judges are not fully repeatable; the same input can score differently across runs.
4. Validation method
   - Before shipping a new metric or a rubric change, run it against a fixed ground-truth trace set with known expected results (the control), plus a set of traces for the change.
   - Ground truth is mostly manual: pick known sessions, create ATA sessions on purpose, or have an AI editor sift raw traces (stored in S3 for ATA) for matching cases.
   - Aim for 30 or more traces; the same set can serve several metrics if the expected score per metric is known, except where metrics compete. Exclude traces that lack the behavior being measured (e.g. no tool calls).
   - Edge cases often only surface in production, so manual pre-checks help but don't cover everything.
5. Existing AgentScore capabilities
   - UI shows composite score, dimensions, per-eval scores, and the underlying trace; users can label results correct/incorrect after the eval.
   - Labeled data is stored and could become ground truth, but nobody has used it that way yet.
   - Users can create their own evals via a guided rubric builder. An MCP lets a user's coding agent infer the agent's purpose, success criteria, and failure modes and generate evals.
   - Trend views exist (recent runs, scores over time) across all tenants through one collector. EvalClaw used Better Stack dashboards for per-metric trends; a failing ATA completion metric turned out to be partly infrastructure issues.
6. UX for non-technical users
   - Raw traces and terms like "tool call" or "inspect all controls" are opaque to end users.
   - Idea: translate traces into plain language ("you asked X, the agent did Y, output was Z"), then ask the user whether it was correct and, if not, what should have happened. This evaluates the evaluator.
   - Plain-language output from the judge is a quick prompt-level fix; already in the backlog, to be moved up.
   - Multi-step evals such as recovery diversity (fail, then recover) will be harder to label simply.
7. Access
   - The colleague can request access to AgentScore (including back office) via the login access-request flow; an admin approves.

## Decisions Made
- Use ground-truth trace sets, run through AgentScore, as the benchmark approach.
- Reuse the same trace set across metrics where expected scores are known.
- Prioritize plain-language explanations of traces and evals.
- Evaluate in bulk through the AgentScore API rather than the UI.

## Action Items
| # | Action | Owner | Due Date | Priority |
|---|--------|-------|----------|----------|
| 1 | Review metrics/rubrics, AgentScore repo, and Confluence; work out how traces are evaluated | Colleague | TBD | Med |
| 2 | Find where raw ATA traces and AgentScore outputs are stored (S3); ask Lior | Colleague (Lior for answers) | TBD | High |
| 3 | Collect or label ground-truth traces (30+), run them through AgentScore via the API, and compare against expected scores | Colleague | TBD | High |
| 4 | Share the repo and the API details for submitting traces | Andrew | TBD | High |
| 5 | Approve the colleague's AgentScore access request (back office) | Andrew / admin | TBD | Med |
| 6 | Mock up a user flow for labeling traces in plain language and share for feedback | Andrew | TBD | Med |
| 7 | Move plain-language trace and eval explanations up the backlog; prompt the judge for plain language | Andrew | TBD | Med |
| 8 | Share EvalClaw trace-summary examples (tool calls, success) | Colleague | TBD | Low |
| 9 | Review whether rubrics need deterministic rules (infra failures, abandoned sessions) | Andrew / Julian | TBD | Med |

## Next Steps
- Colleague digests the session, investigates the data and repo, then reconnects.
- Follow-up catch-up planned for early next week, or end of this week.

## Parking Lot
- How to tell users they have enough traces/evals relative to incoming trace volume.
- How to present labeling to average users who don't understand spans or tools.
- Whether to treat user abandonment as failure.
- Handling hard multi-step rubrics like recovery diversity.
- A dedicated trend dashboard for AgentScore scores.

## Transcript quality notes
- A passage after the repo discussion is garbled in the transcript (repeated "change"), so a few seconds to a minute of speech may be missing. The conversation resumes mid-thought.
- "Tosk" and "Tice" are likely mistranscriptions (probably Tosca and TAIS); I left the substance as ATA/TAIS where clear. "Leor" is Lior.
- Small talk (tenure, Melbourne Cup Day holiday) is omitted.

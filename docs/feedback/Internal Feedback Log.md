# AgentScore Internal Feedback Log

Running log of feedback from Tricentis people using AgentScore. One entry per thread or session. Pull repeated asks into Recurring asks. Do not record credentials, ingest keys, or customer data.

## Recurring asks

| Priority | Ask | Raised by | Status |
|---|---|---|---|
| High | Plain-language explanations of traces, evals, and failures. | 2026-11-04 session, Georgie Zaguirre | Open. The 2026-11-04 notes call judge wording a prompt-level fix already in the backlog, and say to move it up. Georgie asked for a short failure summary in the UI and said the detail is already there if you look for it. || Medium | Benchmark a metric or rubric change on a fixed set of labeled traces (30 or more) with a known expected score per metric. | 2026-11-04 session | Open. Agreed as the method. The same set can cover several metrics. Leave out traces that lack the behavior being measured. || Medium | Plain-language labeling: show what the user asked, what the agent did, and the output, then ask whether it was correct and what should have happened. | 2026-11-04 session | Open. Andrew was to mock the flow. Multi-step cases such as recovery diversity are harder to label. |
| Low | Present a score for each grouping. Keep a single ready-to-ship metric only if the user can configure it. | Julian Ho | Open |
| High | Security gate: below a set level, the agent cannot be marked ready to ship. Show "Needs Work" and the reason. Level not decided. | Georgie Zaguirre | Open |
| Low | "Need attention" flags do not appear to affect the verdict (ATA has 4). That is confusing. | Georgie Zaguirre | Open |
| Low | Compute tool success rate from the trace (failed calls / total calls), not with an LLM. | Georgie Zaguirre | Open |
| Low | Exclude infrastructure failures from task completion: signal loss, middleware, session service. | 2026-11-04 session | Open. Noted for Andrew and Julian to review. |
| Medium | Tag each security finding as prompt injection, PII, credential exposure, or path violation, with a severity. | Georgie Zaguirre | Open |

## Sessions

### 2026-11-08 - ATA ready-to-ship score and metric rules

- **Who:** Julian Ho, Georgie Zaguirre, and Andrew Demers. The thread does not state roles. Julian posted on 2026-11-08; Georgie and Andrew replied through 2026-11-09. Source: https://tricentis.slack.com/archives/C0CFWM3A9EJ/p1794183775976959
- **What we learned:** Julian reviewed ATA evals with Georgie and said they look good, except ready-to-ship: 88% against 40% correct task completion. Georgie wants unequal weights for a task agent and a security gate on ready-to-ship, and she flagged that four ATA evals marked "need attention" do not appear to change the verdict. Julian says weights are domain-specific, so ready-to-ship cannot be predetermined; Georgie is gathering golden or labelled traces to benchmark, and the security level is still open. She also listed four metric changes from earlier ATA work: tool success from the trace, external_termination for abandoned sessions (not shown to the user), security-finding tags, and a short plain-language failure summary.
- **Major asks:**
  - Present a score for each grouping. A single ready-to-ship metric seems useful but could be misleading, unless the user knows enough to configure it.
  - Weight by domain. Metrics are equal today. For ATA, correctness (Automation Task Success + Prompt Compliance) should weigh more. Georgie's example is correctness 50% / tool use 25% / the remaining 25%, which she did not name. Julian: weighting is subjective to the domain (call-centre, test automation, financial, medical or surgical), so they cannot predetermine what is ready-to-ship. Georgie asked him for the weights and said he can wait until her benchmarking is done. The security level is a separate open decision.
  - Treat security as a gate. If it falls below a set level, the agent cannot be marked ready to ship. Show "Needs Work" with the reason, for example "Blocked by security findings". She gave 95% as an example. In earlier evalclaw research, a security finding was a fail; she wants this threshold rule instead.
  - "Need attention" flags do not look like they affect the verdict. ATA has 4 evals flagged, and that can create confusion.
  - Tool success rate from code, not an LLM: failed calls / total calls from the trace.
  - external_termination on correctness, so a user cutting the session short is not a failure. Andrew asked whether this is presented to the user or only updates the score. Georgie: it does not need to be presented. It is an update so the LLM judge can detect abandoned sessions.
  - Classify security findings. Tag each one as prompt injection, PII, credential exposure, or path violation, with a severity.
  - Summarize failure and root-cause attribution in the UI, in plain language. She says the data is already there if you look for it. She pasted an old evalclaw per-metric block as the shape: pass or fail, metric, score, judge type, and a one-line reason.
  - For tosca-agent, the agent that does workspace changes in Tosca: should he create similar .md files, and will code changes be required the way he was told they were for the first set? Nobody answered.
- **Quotes:** "ATA has an 88% ready-to-ship score, but I know that it only correctly completes a task 40% of the time." "the weighting is subjective to the domain... we can't predetermine what is ready-to-ship." "It doesnt need to be presented back to user. It'd be an update to ensure that LLM judge can detect abandoned sessions."

### 2026-11-04 - Ground truth for AgentScore evals

- **Who:** Andrew (AgentScore) and a research-team colleague who has worked on EvalClaw and ATA evals. The notes do not name the colleague. Dave asked them to join. Speaker labels were missing from the transcript. Source: `docs/feedback/feedback-sessions/internal/2026-11-04 Internal Feedback Session.md` (recording `2026-11-04 16-01-18.mp4`).
- **What we learned:** Andrew asked how to tell that an eval set covers an agent's use case, and how to check an eval without knowing the agent well. The colleague's method is a hand-labeled ground-truth set, run through AgentScore and compared with expected scores: 30 or more traces, one set reused across metrics, comparison done through the API. ATA's automation task success of 93 looked too high. Those rubrics were Julian's, moved into AgentScore without a separate check, and the same judge input can score differently across runs. They want plain-language trace and eval text for non-technical users, and they left open whether an infrastructure failure or an abandoned session should count against the agent.
- **Major asks:**
  - Before shipping a metric or rubric change, run it against a fixed ground-truth set with known expected scores. Sources they named: known sessions, ATA sessions created on purpose, or someone sifting raw ATA traces. Those traces are in S3. The colleague was going to ask Lior where the AgentScore outputs are stored. Drop traces that lack the behavior being measured, such as traces with no tool calls. The same set can serve several metrics when each expected score is known, except where metrics compete. Edge cases still tend to show up in production.
  - Plain-language explanations of traces and evals. The notes call judge plain language a prompt-level fix already in the backlog, and say to move it up.
  - A labeling flow for people who do not know spans or terms like "tool call". Proposed shape: you asked X, the agent did Y, output was Z. Then ask whether that was correct and, if not, what should have happened. That checks the evaluator. Recovery diversity (fail, then recover) will be harder to label this way. Users can already mark a result correct or incorrect, and that data is stored, but nobody has used it as ground truth yet.
  - Deterministic rules on task completion. EvalClaw had to exclude sessions where infrastructure failed (signal loss, middleware, session service). Whether a user abandoning or timing out counts as a failure was left open. Andrew and Julian were to review both.
  - Custom metrics need someone who knows the domain. The example given was the product manager. AgentScore is aimed at non-technical users who cannot instrument an agent or write evals themselves.
  - How to tell users they have enough traces and evals for the volume coming in. The session left this open.
  - A dedicated trend dashboard, parked. The notes say trend views of recent runs and scores over time already exist. EvalClaw used Better Stack dashboards for per-metric trends.

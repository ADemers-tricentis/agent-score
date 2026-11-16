# testcase.generate: eval and profile changes (2026-11-16)

Agent: `testcase.generate` (id 01M6E8HC2RH5NNYXNBR5TE2K4H)
Status (updated 2026-11-16 17:16 UTC): both evals and the profile are **published**, `testcase.generate` is **pinned to profile v2**, and a re-score (run 01M7JNRHX0DWBM6ESMTQ80YEYF) was started. Measured "after" numbers are still to be filled in (section 3).

Update after approval: the profile now has 10 entries (v2). v2 adds Agent-Fault Task Success (threshold 0.7, weight 1, correctness). Generated Test Fidelity is published but is **not yet in the profile**, because its preview (job 01M7JNPQ1JE0C8WZ140JB5PFHE) had not finished.

## 1. Before

Scored 2026-11-15 19:05 UTC, run 01M7G9C0BS8EF79WBABTZWHT4Y, profile Tricentis ATA v1 (pinned).

- Composite: **90.2**, verdict **ship** (ship band starts at 85). Confidence interval 86.2 to 94.1.
- 394 traces captured, 160 scored, 20 skipped.

| Dimension | Score | Evals (mean vs threshold) |
|---|---|---|
| safety | 100 | security-findings 100 vs 100 (pass) |
| relevance | 100 | tool-relevance 100 vs 85 (pass) |
| groundedness | 97.2 | faithfulness 94.4 vs 70 (pass), tool-output-consistency 100 vs 85 (pass) |
| agentic_tool_use | 84.8 | tool-success-rate 88.6 vs 85 (pass), **trajectory-efficiency 81.0 vs 85 (fail)**, recovery-diversity 97.8 vs 85 (n_a, 9 traces) |
| correctness | **69.0** | **automation-task-success 66.3 vs 100 (fail, 6 of 20 pass)**, **prompt-compliance 71.7 vs 85 (fail, 10 of 15 pass)** |

Profile: Tricentis ATA v1, 9 evals, all 5 dimensions weighted 1. The profile is shared by 5 agents
(agent_execution, agent_tools_prep, chatbotagentgraph, quality-agent are auto-bound; testcase.generate is pinned).

### What the failing evals actually show

- **automation-task-success** (lowest 6 of 20 all scored 50%): five of the six were external terminations, not agent faults.
  `ask_human` returned "Task was aborted" or timed out, so the rubric gave 0.5. The threshold of 100% fails every one of them.
  One run (SAP IP11/IP12/IP42 flow, trace 1ed339b5...) was a real agent stall on the Packages tree node.
- **prompt-compliance** (lowest 5 scored 0 to 40%): same pattern. Runs aborted at the login pad or on a category error,
  so most of the listed steps never ran. This eval penalizes the operator abort, not the agent.
- **trajectory-efficiency** (81 vs 85): near miss. The Packages-node stall (dozens of clicks and TreeCommands) is a genuine signal.

## 2. Changes made

Nothing existing was modified. Tricentis ATA v1 and all 9 existing evals are untouched, so the 4 other bound agents are unaffected.

### 2a. New draft evals (tenant tier, draft, usable only by the creator)

| Eval | Id | Dimension | Purpose |
|---|---|---|---|
| Agent-Fault Task Success | 01M7JNBTWB4QR940ETCGW8N0K8 (v1 01M7JNBTWB4QR940ETCGW8N0K9) | correctness | Scores 1.0 for success or an external termination with no agent misstep. Scores lower only for agent faults (stalls, ignored errors, unconfirmed success claims). |
| Generated Test Fidelity | 01M7JNBVGY81ERE8WXG6ZMPH5J (v1 01M7JNBVGY81ERE8WXG6ZMPH5K) | correctness | When `generate_automation` runs, checks the generated test against the steps actually executed and the steps requested. Skips traces with no generation. |

Preview results on real traces (nothing saved):

- Agent-Fault Task Success, 5 traces: 1.0 (SAP login abort), 1.0 (SAP login abort), 0.5 (work center run: agent never verified Client 420 vs the Client 410 shown by SAP, and never used F4 to look up categories), 0.5 (Oracle absence run: reported Submit as successful without a completion signal), 1 trace skipped as too large (`trace_too_large`).
  It separates aborts from real misses, which the existing eval does not.
- Generated Test Fidelity, 3 traces (run after publishing): 0.5 (Oracle absence run: right order and values, nothing invented, but the Sign Out step is missing and retry steps add noise), 0.5 (insurance quote run: accurate but stops at Product Data, 4 of 11 requested steps), empty (SAP login run aborted before any generation, correctly left unscored).
  It behaves as designed. It reads only the first 6,000 of 112,680 characters on large generate_automation output, so very large tests are judged from the step description list.

### 2b. New draft profile

`Tricentis ATA - testcase.generate`, id 01M7JNGQM0GTTFEDN509Q6Q07G, v1, intent tag `tool`, status draft.

Identical to Tricentis ATA v1 (same 9 evals, same weights, same verdict bands) except:

| Entry | Before | After |
|---|---|---|
| automation-task-success threshold | 1.00 | **0.50** |

Reason: 0.5 is the score the rubric assigns to "substantive work stands, ended by external termination". At 1.00 those runs can never pass.

### 2c. Decisions not taken

- Dimension weights stay at 1. My first suggestion was to raise correctness weight. The traces showed correctness is depressed by operator aborts, so a higher weight would punish the agent for things it did not do.
- `prompt-compliance` (0.85) and `trajectory-efficiency` (0.85) thresholds unchanged. The first needs the eval itself to skip aborted traces (a new eval version, not done). The second is a real signal.
- Tricentis ATA was not edited because 4 other agents would have been re-scored.

## 3. After

**Not applied yet.** The draft profile cannot be pinned to the agent until it is published, and the two evals cannot be added to a profile until they are published. Publishing is irreversible and visible to every member of the tenant.

Expected effect once pinned (projection from the existing run, not measured):

- automation-task-success pass count moves from 6 of 20 to about 20 of 20 (the lowest 6 interactions were all 50%, so every scored interaction is at or above 0.5). Status moves from fail to good.
- Mean scores and the composite should stay at about 90.2, since a threshold changes pass or fail status, not the per-interaction score.
- Prompt-compliance and trajectory-efficiency remain failing. That is intended, they are the remaining real signals.

Actual after-numbers should be added here after the profile is pinned and the agent is re-scored.

## 4. Done and pending

Done (2026-11-16, approved by the user):
- Published both evals and the profile.
- Added Agent-Fault Task Success to the profile (v2, threshold 0.7).
- Pinned `testcase.generate` to profile v2. Re-pinning to Tricentis ATA v1 is still possible.
- Started a re-score, run 01M7JNRHX0DWBM6ESMTQ80YEYF (20 interactions).

Pending:
1. Read the re-score result and fill in section 3 with measured numbers (get_scorecard).
2. Finish the Generated Test Fidelity preview, then add it to the profile with `entries_add` (new version, suggested threshold 0.7, weight 1) if the scores look sensible.
3. Optional: new version of `prompt-compliance` that leaves aborted traces unscored.

Note: the new Agent-Fault eval will lift the correctness dimension, because aborted runs now score 1.0 on it. That lift reflects a more accurate measure, not an agent improvement. Compare future runs on the same profile version.

## 5. Update (2026-11-16 17:35 UTC)

Profile is now v3 (Agent-Fault Task Success weight 2, Generated Test Fidelity added at 0.7). Measured re-score on v3: composite 85.9, ship, interval 82.0 to 89.8. Full before and after comparison is in [testcase-generate-before-after.md](testcase-generate-before-after.md). The projection in section 3 above (composite staying near 90, correctness rising) was wrong: the new evals found more real agent faults than expected.

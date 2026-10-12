# Skill Benchmark: agentscore-setup

**Model**: claude-sonnet-5-5 (subagents)
**Date**: 2026-10-07
**Evals**: 1, 2, 3 (3 runs each, with skill only; baseline carried over from iteration 2)

## Summary

| Metric | With Skill | Without Skill (iter 2, not re-run) | Delta |
|--------|------------|---------------|-------|
| Pass Rate | 99% ± 2% | 35% ± 4% | +0.64 |
| Time | 79.8s ± 20.2s | 76.1s ± 22.8s | +3.7s |
| Tokens | 53320 ± 3277 | 37902 ± 3537 | +15418 |

## Per run

| Eval | Run 1 | Run 2 | Run 3 |
|------|-------|-------|-------|
| python-openai-sdk | 17/17 | 17/17 | 16/17 |
| langgraph-agent | 17/17 | 17/17 | 17/17 |
| node-vercel-ai-sdk | 17/17 | 17/17 | 17/17 |

## Notes

- 3 runs per eval (iteration 1 and 2 had 1 run per eval). All 9 runs executed in parallel by subagents using a run prompt written for this iteration; the original run protocol was not saved, so setup differs slightly from iterations 1-2.
- Parallel runs shared local stub-server ports; several subagents saw 'address in use' and one stub exited mid-run. All runs still graded independently by grade.py.
- without_skill baseline was NOT re-run; figures are carried over from iteration 2 (identical to iteration 1).
- Time and tokens are subagent totals from the harness notifications, not grader measurements.
- Only miss: python-openai-sdk run 3 report omitted the ~20 trace threshold note (setup itself correct).
- No real send to AgentScore was performed (no ingest key); verification used the local stub OpenAI server, span_tree.py and wire_check.py.

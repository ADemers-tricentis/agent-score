# Demo agent delivery options

Date: 2026-11-23

Goal: decide how users run the AgentScore demo agent in their own environment, get improvement advice, apply a fix, and re-score it, using the approach that works for the widest audience.

Scope of this pass: research only. No files were edited, no demo agent was created, and no MCP write tool was called. Setup times below are estimates, not measurements.

Already decided (not re-litigated): offered only after a coding agent is connected; flight-booking agent with no LLM that replays 20 fixed requests with seeded failures; public GitHub repo with a `fixed` branch; the user's coding agent applies the fix only after the user approves it.

## 1. Comparison

| | 1. Paste prompt | 2. Clone + one command | 3. Docker / devcontainer | 4. Hosted notebook | 5. Pre-recorded traces, we upload | 6a. Codespaces | 6b. Read-only sample tenant |
|---|---|---|---|---|---|---|---|
| **Steps / time to first score** | 1 paste, then 3 user approvals (about 5-10 min) | Clone, install, run, score (about 5-10 min) | Install Docker, build, run (about 10-20 min first time) | Open, add key, run all (about 5-10 min) | 1 click (about 1-2 min, plus scoring time) | Open, wait for build, run (about 5-10 min) | 0 steps (about 0 min) |
| **Prerequisites** | Coding agent already connected (decided). Git and Python or Node. No LLM key | Git, Python or Node, `uv` or `make` | Docker, with a paid licence for larger firms [1] | Google account. An ingest key pasted into the notebook | None on the user side | GitHub account, quota [2] | None |
| **Non-coders / no coding agent** | Excluded by design | Needs a terminal | Needs a terminal and Docker | Possible, but they paste a secret into a notebook | Works | Mostly works, but it is a dev environment | Works |
| **Corporate proxy / firewall** | Needs GitHub, a package index and OTLP egress. Same needs as their own agent path | Same | Same, plus the image registry | Colab behaviour **unverified** | Best. The user's machine sends nothing | Needs GitHub and `*.github.dev`, **unverified** | Best |
| **Trust and safety** | Agent runs cloned code and the user approves each edit. Key stays in a git-ignored env file | User runs our script by hand | Container isolates the code | Key goes into a third-party notebook | No code run. We write into their tenant, so it needs consent | Remote VM | Nothing run |
| **Fix-and-retest loop** | Real. It edits the user's checkout | Real, but the user edits by hand unless an agent is present | Real, but edits happen inside the container | Real in the notebook, awkward to review | **Fake.** It can only show a canned "after" | Real | None |
| **Maintenance for us** | Prompt, repo, `fixed` branch, drift against the MCP doc | Same, plus script portability | Highest: image, base-OS and registry upkeep | Notebook rot, Colab changes | Server-side seeding feature. Recorded traces go stale as the scorer changes | Devcontainer config | Lowest to run, but needs a shared tenant and permission model |

### Sources

1. Docker Desktop is free only for non-commercial open source or companies under 250 employees and $10M revenue: [Docker Subscription Service Agreement](https://www.docker.com/legal/docker-subscription-service-agreement/).
2. Codespaces free tier of 120 core-hours per month on a Free plan came from secondary sources only; check GitHub's own page: [GitHub Codespaces docs](https://docs.github.com/en/codespaces/about-codespaces/what-are-codespaces).
3. `uv` runs a script with inline dependencies and builds its own environment, so option 2 needs no manual venv: [uv scripts guide](https://docs.astral.sh/uv/guides/scripts/).
4. Langfuse ships a public shared example project, the precedent for 6b: [Langfuse demo](https://langfuse.com/docs/demo).
5. Arize says OTLP over HTTP is easier than gRPC through proxies and firewalls, and a custom CA goes through `OTEL_EXPORTER_OTLP_CERTIFICATE`: [Arize exporter docs](https://arize.com/docs/phoenix/tracing/concepts-tracing/otel-openinference/exporter).

### Could not verify

- Colab's network and proxy behaviour (no Colab-specific doc found).
- Whether the Python OTLP HTTP exporter honours `HTTPS_PROXY`.
- Codespaces behaviour behind corporate networks.
- The current Codespaces quota from GitHub's own page.

## 2. Recommendation

**Primary: option 1, with option 2 inside it.** Keep the paste prompt, but make the repo expose one command (for example `uv run demo.py`). The prompt then says "clone, run that command", so the agent is not improvising setup. This is the only option that exercises the loop the product sells: advice, an approved edit, a re-run and a re-score. It also reuses the egress path the user's own agent needs anyway. The `fixed` branch covers a bad edit.

**Fallback: option 5, presented as a 6b-style sample run.** For users with no coding agent, no terminal, or a locked-down network, show a clearly labelled pre-recorded before and after in their tenant. They get the scorecard and the advice, with no fix loop. It is the only option that works for non-coders and for blocked networks.

Docker, notebooks and Codespaces add maintenance and exclude the same people as option 1 (non-coders and blocked networks), so they are not recommended.

**Conflict with a decided point:** "Offered only after a coding agent is connected" conflicts with the fallback. Users with no coding agent can never reach it, so the fallback needs its own entry point.

## 3. Gaps this exposes in the onboarding doc

1. **The re-score is not isolated.** Demo prompt step 4 says "run again and score again" but never calls `start_agent_revision`. Per the `using-the-tools` resource, that tool opens a new window so the next score covers only newer traces. Without it, the second score likely mixes the 20 old and 20 new traces and the before and after is not clean. The mixing is inferred, not tested.
2. **Advice may be withheld.** `get_improvement_advice` reports `withheld_count` for recommendations that carry a link, code, a command or a path. The demo's fixes are code edits, so the top recommendation could be withheld. The doc assumes it never is.
3. **Replayed traffic vs "real requests".** `onboard-your-agent` says to ask for real use, "never send requests to the agent yourself", and that made-up requests make the score less accurate. It is unverified whether 20 replayed requests reach the readiness threshold and get a profile fit. The doc does not say how the demo agent is treated here.
4. **A no-LLM agent still needs scoreable spans.** Scoreable traces need real `LLM` or `TOOL` spans, and the resource says never add dummy child spans. The doc does not say how the demo agent emits genuine tool spans.
5. **Tool groups can be switched off.** `create_ingest_key` and `score_agent` sit behind the "Change, Delete & credentials" and "Spend credits" groups, which an organisation can disable. The demo path has no behaviour for that case.
6. **Rate limits are not planned for.** There is a 5-minute manual scoring cooldown, and 5 calls a minute or 20 an hour on `score_agent`, `start_agent_revision` and `create_agent`. One demo run plus a retry could hit them.
7. **Demo agent as a tenant object.** The doc says "marked Demo and excluded from the fleet", and its "What the MCP needs" list already says no way exists to mark it. Also missing: who creates the demo agent (`create_agent` or auto-created on first trace), its trace name, and what happens on a second run.
8. **Ingest key for a throwaway agent.** The doc does not say whether the demo reuses the user's key or creates a separate one, or whether the key is revoked afterwards. A leftover key is a security question.
9. **Repo trust is unaddressed.** The doc does not say who owns the repo, whether it is pinned to a tag or commit, or what the agent should check before running it.
10. **No path for users without a coding agent.** There is no fallback or entry point for them, which follows from the decided gating.
11. **Prerequisites are not listed.** The path needs GitHub, a package index and OTLP egress. The doc does not state these for proxy-bound users.
12. **Before/after reading is underspecified.** The doc points to `list_runs`, but the documented way to read two runs side by side is `get_scorecard` with `run_id` plus the revision label.

## 4. Open questions

1. Should the no-coding-agent fallback (option 5) be allowed before a coding agent is connected? That reverses one of the decided points.
2. Is Agent Score willing to write pre-recorded traces into a user's tenant server-side? That needs a new feature and a consent line.
3. What is the minimum supported runtime for the demo: Python only, or Node too?
4. Is `uv` acceptable as a prerequisite, or should the one command be plain `python`?
5. Should the demo use the user's own ingest key, or a separate demo key that is revoked afterwards?
6. Should I test whether 20 replayed requests reach readiness and whether the advice is withheld? That means creating an agent and an ingest key, so it needs your go-ahead.

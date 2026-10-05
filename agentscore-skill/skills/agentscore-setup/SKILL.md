---
name: agentscore-setup
description: One-step onboarding of an AI agent to Tricentis AgentScore. Detects the agent's language, framework and LLM SDK, installs the right OpenTelemetry instrumentation, adds a single bootstrap file that exports traces to AgentScore, writes the env placeholders, and verifies the spans before anything is sent. Use whenever the user wants to connect, onboard, instrument, trace or monitor an agent with AgentScore, send traces or OTLP to AgentScore, set up an AgentScore ingest key, or asks why their agent's traces are not showing up or not scoring in AgentScore, even if they never say "OpenTelemetry".
---

# AgentScore setup

Goal: after this runs inside the user's own agent repo, traces flow to AgentScore and the agent is
recognizable and scoreable. The only thing the user supplies is an ingest key (`tk_...`) and, if theirs
differs from the default, the ingest URL.

AgentScore works out which agent it is looking at from the spans themselves, so there is no registration
step and no AgentScore SDK. What makes or breaks onboarding is whether the spans carry what it reads. Two
failure modes to guard against: spans that arrive but cannot be scored (no prompt text, no tool spans, no
root span), and a custom `gen_ai.operation.name`, which makes AgentScore reject the whole trace. That is
why the workflow verifies the span tree locally before sending anything.

Read these as needed, not all up front:
- `references/endpoint-and-auth.md`: URL, key handling, env vars, status codes
- `references/attributes.md`: what AgentScore reads and why
- `references/instrumentors.md`: which package for which SDK, measured caveats
- `references/python.md`, `references/node.md`: per-language wiring and package-manager commands
- `references/manual-spans.md`: root agent span, tool spans, LLM spans written by hand

`scripts/` (stdlib-only; run with system `python3`):
`detect.py` (project facts), `configure_env.py` (env files and .gitignore), `span_tree.py` (span-content
check), `wire_check.py` (transport check against a local receiver).
`assets/` has the bootstrap templates `agentscore_otel.py` and `agentscore-otel.ts`.

## Ground rules

- **Smallest change.** Target: one new bootstrap file, one import line in the entrypoint, dependency
  additions, env placeholders, and (only where needed) wrapper spans. Do not restructure or reformat.
- **Plan first.** Edit nothing until the user has confirmed the plan in step 3.
- **The key stays out of the model's hands.** Never write, print, echo or pass an ingest key as a command
  argument. The user adds it themselves (step 2). Never put it in code, `.env.example`, logs or span data.
- **Idempotent.** Running the skill twice must change nothing the second time. Check before every write.
- **Honest verification.** If the agent cannot be run, say so and do the static check. Never report success
  from a check that did not run.
- Do not modify anything outside the user's repo.

## Workflow

### 1. Detect

Run `python3 <skill>/scripts/detect.py <project dir>` and read the JSON. Then read the entrypoint and the
file(s) where the LLM client and tools are defined, to understand how the agent is built.

If `already_set_up` is true, this is a re-run: go to **Re-runs** below instead of continuing.

Supported first-class: Python and Node/TypeScript. For any other language (Go, Java, .NET, ...), do not
guess at libraries: explain that this skill covers Python and Node, and offer the env-var-only route: any
OTLP/HTTP exporter pointed at the `_TRACES_` variables from `references/endpoint-and-auth.md`, noting that
scoring depends on the spans carrying the attributes in `references/attributes.md`.

If `detect.py` lists existing telemetry (OpenTelemetry, OpenInference, Traceloop, Langfuse, Logfire),
the user already traces. Keep their instrumentors and add AgentScore as an additional exporter; do not
add a second instrumentor for the same SDK.

### 2. Collect connection details (once)

Ask for two things in a single message:
1. **Ingest base URL.** Suggest `https://agent-score-ingest.product.tricentis.com` as the default.
2. **Whether they already have an ingest key**, and if not, where to create one (AgentScore UI,
   **Integrations**). Do not ask them to paste it in chat.

Later, in step 6, give them the `!` command from `references/endpoint-and-auth.md` to add the key to
`.env` themselves.

### 3. Present the plan and wait for confirmation

Show one compact plan and ask to proceed:

- Detected: language, package manager, framework, LLM SDK, entrypoint.
- Instrumentation: which package(s) and why (preference order in `references/instrumentors.md`), and
  whether manual spans are needed (plain SDK code: yes, root and tool spans; framework agents: only if the
  check shows a gap).
- Dependencies to add, with the exact manifest lines, after dropping anything already present.
- Files to create or change, each with a one-line description (bootstrap file, the import line, wrapper
  spans with the functions they touch, `.env.example`, `.gitignore`).
- What will run: one local run of the agent in console mode, then, after you confirm, one run that sends
  real spans to AgentScore.

Do not proceed on silence. If the user changes the plan, redo this step.

### 4. Apply

In this order, checking for existing work before each step:

1. `python3 <skill>/scripts/configure_env.py --base-url <url> --service-name <name> [--family otel]`
   It covers `.gitignore` first (so a key can never be committed), writes placeholders to `.env.example`,
   and fills the non-secret settings (endpoint, service name) into `.env`. Only the key is left for the
   user. `--family otel` only when using the official OTel GenAI instrumentors.
2. Install dependencies with the project's package manager (commands in the language reference). Show the
   manifest diff first, then the `git diff` afterwards. Skip packages already declared.
3. Create the bootstrap file from `assets/`: replace `__SERVICE_NAME__` and the instrumentor placeholder.
   The service name is the project or agent name, not a placeholder left behind.
4. Add the single import at the top of the entrypoint.
5. Add manual spans only as planned (`references/manual-spans.md`), touching as few lines as possible.

### 5. Verify locally

Run the agent once with `AGENTSCORE_EXPORTER=console`; the bootstrap then writes spans to
`.agentscore-spans.jsonl` and sends nothing. Use the project's own run command and interpreter. Pass any
credentials the agent needs through the environment the user already has, never as literals.

Then `python3 <skill>/scripts/span_tree.py`. It prints the tree and checks: a root span, LLM spans with
model, tokens and prompt text, tool spans, an identity signal, no HTTP/DB noise, an accepted
`gen_ai.operation.name`, and no ingest key in the data. Fix each FAIL (the check names point to the
reference section) and re-run until it passes. Treat WARN lines as things to mention, not blockers.

Console mode shows what the spans contain but never touches the real exporter, so also run the transport
check: `python3 <skill>/scripts/wire_check.py -- <the agent's run command>`. It points the standard
`_TRACES_` variables at a local receiver with a made-up key and confirms the path, the bearer header
coming from the environment, and a protobuf body (AgentScore rejects JSON bodies). This catches a wrong
exporter package, a hard-coded endpoint, or a bootstrap that is imported too late, before any real send.

**If the agent cannot be run** (missing credentials, services it needs, an unbuildable environment): say
that plainly, and do the static check instead: confirm the import is first in the entrypoint, the
instrumentor matches the SDK in use, every tool dispatch site is wrapped or covered by the framework, the
manifest has every package the bootstrap imports, and no `gen_ai.operation.name` outside the accepted list
is set anywhere. Report the result as "statically checked, not run" and tell the user to run
`AGENTSCORE_EXPORTER=console <their run command>` followed by `span_tree.py` themselves.

Delete `.agentscore-spans.jsonl` afterwards (it is git-ignored, but it can contain prompt text).

### 6. Switch to real export

1. Ask the user to add the key with the `!` command (see `references/endpoint-and-auth.md`). It is the
   only manual step: step 4 already put everything else in `.env`. Confirm by checking the variable name
   is present in `.env`, never by printing it.
2. Ask before sending: "Run the agent once and send a real trace to AgentScore?" On yes, run it without
   `AGENTSCORE_EXPORTER`. Watch stderr for 401/403/429/503 and use the status table to explain any failure.
3. Tell the user how to confirm arrival: in AgentScore, open **Agents**; the agent appears as
   **Setting up**, then **Learning your agent** with an "n of 20 traces" counter once the first trace lands.
   Scoring starts after about 20 traces (per AgentScore's docs). Ask them to run realistic traffic,
   including ordinary failures, not only their best examples.

### 7. Report

Finish with: what was detected, files created or changed (list), dependencies added, the verification
result (ran, or statically checked), and the exact next step for the user (key, run, where to look).
Mention any WARN lines and anything you could not verify.

## Re-runs

When `already_set_up` is true, change nothing that exists. Check, in order: the bootstrap file is present
and imported first in the entrypoint; every dependency it needs is declared; `.env.example` has the managed
block (re-run `configure_env.py`, which is idempotent); `.gitignore` covers `.env`. Fix only what is
missing, run steps 5 and 6 to re-verify, and report "already set up" plus any repairs. If the user wants a
different URL or service name, edit those values in place rather than adding a second block or file.

## Troubleshooting someone else's setup

If the user says traces are missing or the agent will not score, skip to verification: run
`span_tree.py` on a console-mode run, and compare the failing check to `references/attributes.md`.
Common causes: no root span (each LLM call a separate trace), no prompt text (official OTel instrumentor
without content capture), a custom `gen_ai.operation.name`, `OTEL_EXPORTER_OTLP_ENDPOINT` used instead of
the `_TRACES_` variable, a missing `tk_` prefix on the key, a JSON exporter (Node `exporter-trace-otlp-http`;
use `-proto`), or the bootstrap imported after the client. `wire_check.py` pinpoints the transport ones.

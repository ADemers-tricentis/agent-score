# Alternative Proposal: AgentScore CLI as the Execution Layer

Date: 2026-10-13
Companion to: Review of "AgentScore Auto Setup and Self-Improvement Loop"

## Summary

The PRD delivers AgentScore setup and the improvement loop through a hosted MCP connector. A remote connector cannot touch the customer's machine, so it must leave key handling, repository detection, version tagging, and guardrail enforcement to the customer's coding assistant. Those are exactly the gaps the review found.

This proposal puts a small command-line tool where the agent runs. The tool does the local work. The hosted API stays. The connector becomes a thin layer on top for discovery and for chat-only clients.

This is not "CLI instead of MCP". It is "CLI does the work, MCP exposes it".

## Why the local gap matters

Every unresolved problem in the PRD has the same root: AgentScore is remote and the agent is local.

| Gap in the PRD | Why a remote connector cannot close it | What a local tool does |
| --- | --- | --- |
| Getting the ingest key into the runtime | Server must not see or hand out the key; user must find a secret store themselves | Sign in once, store the key in the OS secure store, inject it when the agent runs |
| Knowing which code version produced which score | Server only sees traces; nothing names the version | Wrap the agent run, stamp the git revision on every trace |
| Detecting the real setup state | Server sees a value-free fingerprint | Read the repository directly; tell healthy, partial, conflicting, unsupported apart |
| Verifying before anything is sent | Server can only check what arrived | Check span structure locally with a clear message, then confirm receipt |
| One change per cycle, rollback, reporting | Guidance only; client decides | Inspect the diff, roll back through version control, record the update automatically |
| Serving engineers and CI | Connector targets the assistant only | Same tool runs in a terminal, in CI, and under a coding assistant |

## What the tool does

**Sign in and key custody.** `agentscore login` opens the browser sign-in, resolves the tenant, and stores the ingest key in the operating system keychain or credential manager. The key is never printed, never written to a project file, never passed through chat.

**Run wrapping.** `agentscore run -- <the user's normal start command>` starts the agent with the key and endpoint injected as environment variables, and sets a version attribute from the current git revision so every trace is tied to the code that produced it. For users without git, the tool mints and stores a version identifier itself.

**Detection and setup.** `agentscore setup` inspects the repository, reports the setup state in plain language, fetches the telemetry contract from the API, and either applies the change itself or hands the contract to the coding assistant. The user still confirms before anything is written.

**Verification.** `agentscore verify` checks the local span output against the contract, explains any failure in plain language pointing at the exact requirement missed, then confirms the server received traces for the current version.

**Status and suggestions.** `agentscore status` and `agentscore suggest` call the hosted API with the signed-in user's token. Same data as the connector tools, available in a terminal and in CI.

**Improvement loop.** `agentscore improve` runs one cycle: fetch the top suggestion, confirm the change set is a single bounded change by inspecting the diff, record intent, run, wait for a re-score of the new version, compare version to version, keep or roll back, report. Approval behavior is a local setting the user controls; the tool enforces it, which the connector cannot.

**Structured output.** Every command accepts a flag for machine-readable output, so a coding assistant can drive the tool exactly as it would drive connector tools.

**Connector mode.** `agentscore mcp` exposes the same commands as a local connector, so assistants that prefer discovering tools get them without the hosted server having to do local work.

## How this changes the PRD

Keeps unchanged: the hosted API, the telemetry contract, the scoring routes, the suggestion source decision, benchmark protection, tenant isolation, audit logging.

Moves from "the client decides" back to "enforced for users who opt in": one change per cycle, re-score before the next change, rollback on regression, automatic reporting, no edits to instrumentation except verification fixes.

Removes: the lossy fingerprint, the "key never leaves the user but the user must place it" contradiction, the version-identity gap, the voluntary-reporting hole in the metrics.

Reframes the connector: remote connector for chat-only clients reading status and suggestions; local connector mode for coding assistants; no setup logic on the hosted server.

Restores a path for engineers: the retired skill's audience gets the same tool with full diff visibility.

## Costs and risks

**An install step.** This contradicts the PRD goal "nothing installed locally". In practice the coding assistant can install the tool, and the persona already allows the assistant to modify the repository, which is a larger change than installing a tool. The goal should be restated as "nothing the user has to install by hand".

**Chat-only assistants cannot use it.** A web chat client with no file access gets the remote connector for status and suggestions only, which is the same limit the PRD already documents.

**Distribution.** Signed binaries for macOS, Windows, Linux; an update channel; organizations that block unsigned or unknown executables. Standard cost for any developer tool; not small.

**Hosted-platform agents.** Agents running where the user has no shell are not helped by a local tool. The PRD does not help them either; this stays an open question.

**Client-side logic can be bypassed.** A hostile client can skip the tool. The guarantee is "enforced for cooperating users", which is still far stronger than instructions in a playbook.

**Two surfaces to keep in sync.** The connector and the tool must present the same contract and the same plain-language messages. Mitigation: the tool is the single implementation; the connector wraps it.

## Suggested first release

One tool, three platforms, one named coding assistant: sign in, store key, detect, set up, run with version tagging, verify locally and against received traces, show status, fetch one suggestion. Remote connector for status and suggestions only. Improvement-loop command ships once the version-filtered score comparison exists on the API side.

## Open questions

1. Is "nothing to install" a hard requirement from customers, or a design preference? Would "the assistant installs it for you" satisfy it?
2. Which platforms and package channels for the first release?
3. Can the hosted API accept a version attribute and filter score, status, and verification by it? This is needed regardless of surface.
4. Does the tool apply setup changes itself or always delegate writing to the coding assistant?
5. Where does the local approval setting live, and should the tool refuse to run the loop above a certain risk class regardless of that setting?
6. Does the existing Claude Code skill become a thin wrapper over the tool instead of being retired?
7. Who owns the tool: the connector team, or the platform team that owns the API?

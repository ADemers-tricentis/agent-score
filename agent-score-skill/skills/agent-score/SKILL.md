---
name: agent-score
description: Configure OpenTelemetry (OTEL) tracing to export to Tricentis Agent Score. Use when (1) setting up OTEL tracing for an AI agent or LLM application to send data to Agent Score, (2) the user has an Agent Score ingest key and wants traces flowing to the platform, or (3) instrumenting a new or existing app with OTEL and Agent Score as the backend.
allowed-tools:
  - Read
  - Edit
  - Write
  - Bash(pip install *)
  - Bash(pip show *)
  - Bash(npm install *)
  - Bash(npm ls *)
  - Bash(npx *)
  - Bash(grep -r *)
  - Bash(find . *)
  - Bash(cat *)
---

# Agent Score - OTEL Tracing Configuration

This skill configures an application to export OpenTelemetry traces to Tricentis Agent Score. It works for a brand-new agent with no prior setup: point an OTLP exporter at the ingest endpoint, authenticate with a tenant ingest key, and emit spans with attributes Agent Score recognizes. Agent Score **auto-discovers** the agent from its traces - there is no agent-registration step and no per-agent SDK to install.

**Ingest endpoint:** `https://agent-score-ingest.product.tricentis.com/external/otel/v1/traces`
**Auth header:** `Authorization: Bearer <your tk_... ingest key>`

The ingest key is a **per-tenant** key shown as `tk_...` (not a generic API key - each key belongs to exactly one tenant). Manage keys in the Agent Score UI under **Integrations** in the sidebar (create / rotate / revoke), or let the **Agents page -> + Add agent** wizard hand you the exporter config with the key already filled in.

> **Reachable over the Tricentis VPN only.** The ingest endpoint is only reachable from the Tricentis VPN. Whatever sends traces - the agent, its exporter, or the host it runs on - must be able to reach it from there.

---

## Prerequisites

- **A tenant (workspace).** Traces authenticate to a tenant. A tenant is provisioned by the Agent Score team on your behalf; agents that run in AI Workspace get one automatically on first ingestion. Setup is once per workspace, not once per agent.
- **An ingest key** (`tk_...`) for that tenant, from **Integrations**.
- **A network path** to the ingest endpoint over the Tricentis VPN.

---

## Core Principles

1. **Detect before installing** - Read existing files to understand the stack before installing anything.
2. **Prefer an instrumentation library** - The fastest way to emit spans Agent Score can actually score is a framework/LLM instrumentation library (Langfuse, OpenLLMetry, OpenInference) that already emits recognized attributes. Hand-roll spans only when nothing fits - see [references/semantic-conventions.md](references/semantic-conventions.md).
3. **Env vars for secrets** - Never hardcode the ingest key. Always use environment variables or a `.env` file.
4. **Minimal change** - Add only what is needed to wire up the exporter. Do not restructure the app.
5. **Signal clearly** - After configuration, tell the user exactly what to set and where to get the ingest key.

---

## Workflow

### Step 1 - Assess the project

Check for:
- Language/runtime (Python, Node.js/TypeScript, Java, Go)
- Existing OTEL setup (look for `opentelemetry`, `@opentelemetry`, `otel` in dependency files)
- Framework in use (LangChain, LlamaIndex, OpenAI Agents SDK, CrewAI, LangGraph, plain OpenAI SDK, etc.)
- Existing `.env` or environment variable configuration

```bash
# Python
find . -name "requirements*.txt" -o -name "pyproject.toml" -o -name "setup.py" | head -5
grep -r "opentelemetry" requirements*.txt pyproject.toml 2>/dev/null | head -20

# Node.js
find . -name "package.json" -not -path "*/node_modules/*" | head -5
grep -r "opentelemetry" package.json 2>/dev/null | head -20
```

### Step 2 - Ask for the ingest key (if not already set)

If `AGENT_SCORE_API_KEY` is not already in the environment or `.env`, tell the user:

> "You'll need an Agent Score ingest key (it looks like `tk_...`). Get it from the Agent Score UI -> Integrations, or from the Agents page -> + Add agent wizard, then set it as `AGENT_SCORE_API_KEY` in your environment or `.env` file."

Do **not** ask the user to paste the key into the chat.

### Step 3 - Install and configure the exporter

Follow the relevant reference file for the detected stack:

- Python app: [references/python.md](references/python.md)
- Node.js / TypeScript app: [references/nodejs.md](references/nodejs.md)
- Environment-variables-only approach (any language): [references/env-vars.md](references/env-vars.md)

### Step 4 - Make the spans scorable

Ingestion is not the same as scoring. For a brand-new agent to be recognized (as an agent, a tool call, a generation, etc.) and scored, its spans must carry attributes Agent Score recognizes. If Step 3 used a framework instrumentation library, this is largely handled for you. If the app emits custom or manual spans, set the recognized attributes explicitly - see [references/semantic-conventions.md](references/semantic-conventions.md).

### Step 5 - Verify

After configuration, remind the user to:

1. Set `AGENT_SCORE_API_KEY` in their environment.
2. Confirm the host can reach the ingest endpoint over the Tricentis VPN.
3. Run the application and perform an action that triggers a trace.
4. In the Agent Score UI, the agent appears in a **Setting up** state, then **Learning your agent** with a live "n of 20 traces" count once the first trace lands.
5. **Scoring begins automatically after 20 traces.** Send real or realistic traffic - including ordinary failures and edge cases - not a hand-picked set of the agent's best outputs.

---

## Agent Score OTEL Connection Details

| Setting | Value |
|---|---|
| Traces endpoint | `https://agent-score-ingest.product.tricentis.com/external/otel/v1/traces` |
| Protocol | OTLP/HTTP (protobuf or JSON), gzip supported |
| Auth header | `Authorization: Bearer <tk_... ingest key>` |
| Env var for key | `AGENT_SCORE_API_KEY` (holds the `tk_...` value) |
| Service name | User's app/agent name (set via `OTEL_SERVICE_NAME` or in code) |
| Network | Tricentis VPN only |

> **Note on endpoint vs base URL:** The full path includes `/v1/traces`. Prefer the signal-specific `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT` with the full path. If an SDK expects a *base* URL (and appends `/v1/traces` itself), use `https://agent-score-ingest.product.tricentis.com/external/otel` as the base. Do **not** put the full path in the unsuffixed `OTEL_EXPORTER_OTLP_ENDPOINT` - most exporters append `/v1/traces` to that on their own, which would duplicate the path. See each reference file for specifics.

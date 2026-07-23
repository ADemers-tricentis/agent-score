---
name: agent-score
description: Configure OpenTelemetry (OTEL) tracing to export to Tricentis Agent Score. Use when (1) setting up OTEL tracing for an AI agent or LLM application to send data to Agent Score, (2) the user has an Agent Score API key and wants traces flowing to the platform, or (3) instrumenting a new or existing app with OTEL and Agent Score as the backend.
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

This skill configures an application to export OpenTelemetry traces to Tricentis Agent Score.

**Ingest endpoint:** `https://agent-score-ingest.product.tricentis.com/internal/otel/v1/traces`
**Auth header:** `Authorization: Bearer <your-agent-score-api-key>`

The API key is obtained from the Agent Score UI under Settings -> API Keys.

---

## Core Principles

1. **Detect before installing** - Read existing files to understand the stack before installing anything.
2. **Env vars for secrets** - Never hardcode the API key. Always use environment variables or a `.env` file.
3. **Minimal change** - Add only what is needed to wire up the exporter. Do not restructure the app.
4. **Signal clearly** - After configuration, tell the user exactly what to set and where to get the API key.

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

### Step 2 - Ask for the API key (if not already set)

If `AGENT_SCORE_API_KEY` (or similar) is not already in the environment or `.env`, tell the user:

> "You'll need an Agent Score API key. Get it from Agent Score UI -> Settings -> API Keys, then set it as `AGENT_SCORE_API_KEY` in your environment or `.env` file."

Do **not** ask the user to paste the key into the chat.

### Step 3 - Install and configure

Follow the relevant reference file for the detected stack:

- Python app: [references/python.md](references/python.md)
- Node.js / TypeScript app: [references/nodejs.md](references/nodejs.md)
- Environment-variables-only approach (any language): [references/env-vars.md](references/env-vars.md)

### Step 4 - Verify

After configuration, remind the user to:

1. Set `AGENT_SCORE_API_KEY` in their environment.
2. Run the application and perform an action that triggers a trace.
3. Check Agent Score UI to confirm traces are appearing.

---

## Agent Score OTEL Connection Details

| Setting | Value |
|---|---|
| Traces endpoint | `https://agent-score-ingest.product.tricentis.com/internal/otel/v1/traces` |
| Protocol | OTLP/HTTP (protobuf or JSON) |
| Auth header | `Authorization: Bearer <AGENT_SCORE_API_KEY>` |
| Service name | User's app name (set via `OTEL_SERVICE_NAME` or in code) |

> **Note on endpoint vs base URL:** The full path includes `/v1/traces`. If an SDK expects a *base* URL (and appends `/v1/traces` itself), use `https://agent-score-ingest.product.tricentis.com/internal/otel` as the base. See each reference file for specifics.

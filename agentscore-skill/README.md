# AgentScore setup skill

A Claude Code skill that connects an AI agent to [Tricentis AgentScore](https://agent-score.product.tricentis.com).
Run it inside your own agent repo:

```
/agentscore-setup
```

It detects your language, framework and LLM SDK, shows a plan, then (after you confirm) installs the
matching OpenTelemetry instrumentation, adds one bootstrap file, writes env placeholders, and checks the
span tree locally before sending anything. You supply an ingest key (`tk_...`, from **Integrations** in
AgentScore) and the ingest URL if yours differs from the default.

Traces go to `<ingest URL>/external/otel/v1/traces` over OTLP/HTTP with `Authorization: Bearer tk_...`.
The key is added to your git-ignored `.env` by a command you run yourself, so it never passes through the
assistant or appears in code, logs or `.env.example`.

## Coverage

| Language | Frameworks and SDKs |
|---|---|
| Python | OpenAI, Anthropic, Google Gen AI, LangChain / LangGraph, LlamaIndex, OpenAI Agents SDK, CrewAI, LiteLLM, Pydantic AI |
| Node / TypeScript | Vercel AI SDK, OpenAI, Anthropic, LangChain.js |
| Anything else | Env-var-only route: point any OTLP/HTTP exporter at the same variables |

Verified end to end against a stub LLM: plain OpenAI SDK (Python), LangGraph, Vercel AI SDK v5 and v7.
Other rows use real, existing instrumentor packages but have not been run here.

## Layout

```
.claude-plugin/plugin.json
skills/agentscore-setup/
  SKILL.md                workflow
  references/             endpoint and auth, attributes AgentScore reads, instrumentors, python, node, manual spans
  assets/                 bootstrap templates (Python, TypeScript)
  scripts/                detect.py, configure_env.py, span_tree.py
  evals/                  test prompts and offline fixtures
```

## What it does not do

It does not register the agent (AgentScore discovers it from traces), create tenants or keys, or touch
anything outside your repo.

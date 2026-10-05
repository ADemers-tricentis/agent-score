# Plan: connect agent.py to AgentScore

Assumptions (no AgentScore docs available to me): AgentScore ingests OpenTelemetry traces over OTLP/HTTP at
`https://agent-score-ingest.product.tricentis.com` (`/v1/traces`), authenticated with an ingest key sent as a bearer token. Please confirm the exact header once you have a key.

Changes
1. `requirements.txt`: add `opentelemetry-sdk`, `opentelemetry-exporter-otlp-proto-http`, `opentelemetry-instrumentation-openai-v2` (GenAI semantic conventions for OpenAI calls). Install into `.venv` with `uv pip` (pip-style project).
2. New `agentscore_tracing.py`: `setup_tracing()` configures a TracerProvider, OTLP/HTTP exporter to `AGENTSCORE_INGEST_URL` (default the URL above) with `Authorization: Bearer $AGENTSCORE_INGEST_KEY`, and instruments the OpenAI SDK. If no key is set it does NOT export over the network (no-op for export). Optional `AGENTSCORE_LOCAL_SPANS=1` writes spans to `.agentscore-spans.jsonl` for local verification.
3. `agent.py`: call `setup_tracing()` at startup; wrap `run()` in an agent span and each tool call in a tool span (`gen_ai.operation.name=execute_tool`); flush on exit.
4. Idempotent: re-running changes nothing once applied.

Verification: run against local stub OpenAI server, inspect local spans. No real traces are sent.
Next for user: create an ingest key in AgentScore, `export AGENTSCORE_INGEST_KEY=...`.

## Revision during implementation
`opentelemetry-instrumentation-openai-v2` does not work with this venv (openai 3.22 uses `httpx2`, the instrumentor imports `httpx` and a missing util module). Dropped it; instead each `chat.completions.create` call is wrapped in a manual GenAI-convention span (`chat <model>`, with model, token usage, finish reason). Only `opentelemetry-sdk` and `opentelemetry-exporter-otlp-proto-http` are added.

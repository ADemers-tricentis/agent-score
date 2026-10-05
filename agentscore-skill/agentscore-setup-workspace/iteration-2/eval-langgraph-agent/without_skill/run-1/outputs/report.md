# AgentScore tracing setup - LangGraph support agent

Done (nothing committed, no real traces sent):
- Plan written first to plan.md.
- `uv add opentelemetry-sdk opentelemetry-exporter-otlp-proto-http openinference-instrumentation-langchain` (pyproject.toml, uv.lock).
- New `project/agentscore_tracing.py`: idempotent `init_tracing()`; OTLP/HTTP to `$AGENTSCORE_INGEST_URL` (default https://agent-score-ingest.product.tricentis.com) + `/v1/traces`, `Authorization: Bearer $AGENTSCORE_INGEST_KEY`; no-op with a warning if no key; `AGENTSCORE_LOCAL_SPANS=1` also writes `.agentscore-spans.jsonl`; flushes on exit.
- `main.py`: imports and calls `init_tracing()`.
- `.env.example` and `.gitignore` (.env, spans file) added.

Verified locally against the stub OpenAI server: 15 spans (LangGraph, agent, ChatOpenAI x2, lookup_order tool, etc.). Agent also runs fine with no key set. Stub stopped.

Idempotency: second pass from scratch changed no files (idempotency.json: {"changed": []}).

User must next: create an ingest key in AgentScore, `export AGENTSCORE_INGEST_KEY=...`, run `uv run python main.py`, and check the trace appears. Caveat: the `/v1/traces` path and Bearer auth header are assumed standard OTLP conventions and could not be confirmed against AgentScore docs; adjust if the ingest key page says otherwise.

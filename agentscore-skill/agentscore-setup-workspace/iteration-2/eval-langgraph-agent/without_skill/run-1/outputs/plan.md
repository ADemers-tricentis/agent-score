# Plan: send traces from the LangGraph support agent to AgentScore

Approach: OpenTelemetry (OTLP/HTTP) + OpenInference LangChain instrumentation, which covers LangGraph agent, LLM and tool spans.

1. `uv add opentelemetry-sdk opentelemetry-exporter-otlp-proto-http openinference-instrumentation-langchain` (updates pyproject.toml and uv.lock).
2. Add `agentscore_tracing.py`: an idempotent `init_tracing()` that
   - does nothing (with a warning) if `AGENTSCORE_INGEST_KEY` is unset, so the agent still runs;
   - sets up a TracerProvider with an OTLP/HTTP exporter to `AGENTSCORE_INGEST_URL` (default `https://agent-score-ingest.product.tricentis.com`) + `/v1/traces`, with `Authorization: Bearer <key>` read from env (never hard-coded);
   - instruments LangChain/LangGraph;
   - optional local verification: if `AGENTSCORE_LOCAL_SPANS=1`, also write spans to `.agentscore-spans.jsonl`.
3. Edit `main.py`: import and call `init_tracing()` before building the model; flush spans at exit.
4. Add `.env.example` (placeholders only) and a `.gitignore` entry for `.env` and `.agentscore-spans.jsonl`.
5. Verify locally against the stub OpenAI server with local span file only (no real send). Confirm spans for the agent, LLM calls and tool call.
6. Re-run the whole procedure to check idempotency.

Not done: no real traces are sent; the user must create an ingest key in AgentScore and set `AGENTSCORE_INGEST_KEY`. The exact auth header/path is assumed (OTLP standard, Bearer) and should be confirmed against AgentScore's docs. Nothing is committed.

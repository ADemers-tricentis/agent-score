# Plan (agentscore-setup)

Detected: Python, uv, frameworks langchain + langgraph (langchain-openai), entrypoint main.py, no existing telemetry, not set up yet.
Ingest base URL: https://agent-score-ingest.product.tricentis.com (user supplied). No ingest key exists; none will be written.

Instrumentation: OpenInference LangChain instrumentor (covers LangGraph + langchain-openai; no OpenAI instrumentor, to avoid duplicate LLM spans). No manual spans initially; add only if span_tree.py fails.

Dependencies (uv add): opentelemetry-sdk, opentelemetry-exporter-otlp-proto-http, openinference-instrumentation-langchain, python-dotenv.

Files:
- .gitignore (covers .env, spans file) and .env.example (placeholders, tk_REPLACE_ME) and .env (non-secret endpoint + service name only) via configure_env.py
- agentscore_otel.py (new bootstrap, service name research-agent)
- main.py: one import line `import agentscore_otel` before third-party imports
- pyproject.toml / uv.lock: dependency additions

Verification: run main.py with AGENTSCORE_EXPORTER=console against stub OpenAI server (OPENAI_BASE_URL local, dummy key), span_tree.py, wire_check.py (local receiver, fake key). Delete .agentscore-spans.jsonl afterwards. No real send; user must add the key via the ! command themselves.
Re-run: second pass should change nothing.

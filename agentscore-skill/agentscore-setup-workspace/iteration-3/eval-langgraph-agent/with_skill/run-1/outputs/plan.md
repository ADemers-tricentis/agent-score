# Plan (agentscore-setup)

Detected: Python, uv (uv.lock, .venv), frameworks langchain + langgraph (langchain-openai), entrypoint main.py. No existing telemetry.
Ingest base URL (given by user): https://agent-score-ingest.product.tricentis.com. No ingest key exists; none will be written.

Instrumentation: OpenInference LangChain instrumentor (covers LangGraph). Framework agent, so no manual spans unless span_tree.py shows a gap.
Dependencies (uv add): opentelemetry-sdk, opentelemetry-exporter-otlp-proto-http, openinference-instrumentation-langchain, python-dotenv.
Files:
- configure_env.py: .gitignore (covers .env), .env.example placeholders (tk_REPLACE_ME), .env non-secret settings (endpoint, service name research-agent)
- agentscore_otel.py (new bootstrap from template, service name research-agent, LangChainInstrumentor)
- main.py: one import line `import agentscore_otel` before third-party imports
- pyproject.toml / uv.lock via uv add
Verification: run with stub OpenAI server (OPENAI_BASE_URL local, dummy key), AGENTSCORE_EXPORTER=console, span_tree.py, then wire_check.py against local receiver. Delete .agentscore-spans.jsonl afterwards. No real send (no key).
Step 6: user adds key themselves via the `!` command; real send not performed.
Second pass: re-run per "Re-runs" and record changed files.

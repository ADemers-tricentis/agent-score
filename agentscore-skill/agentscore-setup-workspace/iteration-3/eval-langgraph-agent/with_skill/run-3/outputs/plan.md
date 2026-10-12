# Plan: AgentScore setup

Detected: Python, uv, frameworks langchain + langgraph (langchain-openai), entrypoint main.py, existing venv .venv, no existing telemetry, not set up.
Ingest base URL (given by user): https://agent-score-ingest.product.tricentis.com. No ingest key exists; placeholder only.

Instrumentation: OpenInference LangChain instrumentor (covers LangGraph + langchain-openai; no OpenAI instrumentor, to avoid duplicate spans). No manual spans initially; add only if span_tree.py shows gaps.

Dependencies (uv add): opentelemetry-sdk, opentelemetry-exporter-otlp-proto-http, openinference-instrumentation-langchain, python-dotenv.

Files:
- configure_env.py: .gitignore (covers .env), .env.example (placeholders, tk_REPLACE_ME), .env (endpoint + service name only, no key)
- agentscore_otel.py (new bootstrap from template, service name research-agent... project name)
- main.py: one import line before third-party imports
- pyproject.toml / uv.lock: dependency additions

Verification: run with AGENTSCORE_EXPORTER=console against local stub OpenAI server (OPENAI_BASE_URL, dummy key), span_tree.py, wire_check.py (local receiver, fake key). Delete .agentscore-spans.jsonl. No real send (no key).
Then report.md and a second idempotent pass.

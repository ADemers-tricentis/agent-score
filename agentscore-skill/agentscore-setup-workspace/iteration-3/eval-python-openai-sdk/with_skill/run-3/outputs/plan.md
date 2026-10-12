# Plan (written before any project change)

Detected: Python, pip + requirements.txt, .venv present, plain OpenAI SDK (no framework), entrypoint agent.py, no existing telemetry, not yet set up.
Connection: ingest base URL https://agent-score-ingest.product.tricentis.com (user supplied). No ingest key exists; only placeholder tk_REPLACE_ME in .env.example. No real send.

Instrumentation: OpenInference openai instrumentor (openinference-instrumentation-openai). Plain SDK code, so manual spans: root invoke_agent span around run(), execute_tool span around the tool dispatch.

Dependencies appended to requirements.txt (unpinned): opentelemetry-sdk, opentelemetry-exporter-otlp-proto-http, openinference-instrumentation-openai, python-dotenv.

Files:
- configure_env.py: .gitignore (.env), .env.example (placeholders), .env (endpoint, service name only)
- agentscore_otel.py (new bootstrap from template, service name order-support-agent)
- agent.py: one import line before openai import; root + tool spans
- requirements.txt: deps

Verification: run agent in console mode against stub OpenAI server, span_tree.py, wire_check.py (local receiver, fake key). Delete .agentscore-spans.jsonl afterwards. Then idempotency re-run.

# Plan: connect order-support agent to AgentScore

Detected: Python, pip + requirements.txt, .venv present, plain OpenAI SDK (no framework), entrypoint agent.py, no existing telemetry.
Ingest base URL: https://agent-score-ingest.product.tricentis.com (user supplied). No ingest key exists; none will be written.

Instrumentation: OpenInference OpenAI instrumentor (default). Plain SDK, so manual spans are needed: root agent span around run() and a tool span at the DISPATCH call.

Dependencies appended to requirements.txt (unpinned, none already present):
- opentelemetry-sdk
- opentelemetry-exporter-otlp-proto-http
- openinference-instrumentation-openai
- python-dotenv (project does not load .env otherwise)
Installed into project .venv.

Files:
- .gitignore (new, covers .env and span file) via configure_env.py
- .env.example (placeholders, tk_REPLACE_ME), .env (endpoint + service name only, no key)
- agentscore_otel.py (bootstrap, from template, service name order-support-agent)
- agent.py: one import line at top, root span wrapper on run(), tool span around dispatch
- requirements.txt additions

Verification: console-mode run against local stub OpenAI server, span_tree.py, wire_check.py (local receiver, fake key). No real send; key left for user to add via the ! command.
Then idempotency re-run.

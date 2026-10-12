# Plan (agentscore-setup)

Detected: Python, pip + requirements.txt, existing .venv, plain OpenAI SDK, entrypoint agent.py, no existing telemetry.
Ingest base URL (given by user): https://agent-score-ingest.product.tricentis.com
Ingest key: none exists. Placeholder only (tk_REPLACE_ME in .env.example); user adds the real key later.

Instrumentation: OpenInference OpenAI instrumentor (default). Plain SDK, so manual spans are needed: root invoke_agent span around run(), execute_tool span around the tool dispatch.

Dependencies (append to requirements.txt, then pip install in .venv):
opentelemetry-sdk, opentelemetry-exporter-otlp-proto-http, openinference-instrumentation-openai, python-dotenv

Files:
- create agentscore_otel.py (from template, service name order-support-agent, OpenAI instrumentor)
- agent.py: add `import agentscore_otel` before the openai import; wrap run() in root span; wrap dispatch call in tool span
- requirements.txt: add packages
- .gitignore, .env.example, .env (non-secret settings only) via configure_env.py

Verification: console mode run against local stub OpenAI server, span_tree.py, wire_check.py (local receiver, fake key). No real send. Delete .agentscore-spans.jsonl after.
Re-run: second pass via the Re-runs section, expecting no changes.

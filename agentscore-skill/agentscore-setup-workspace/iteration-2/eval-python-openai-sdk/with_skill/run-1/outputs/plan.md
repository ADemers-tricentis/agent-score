# AgentScore setup plan

Detected: Python, pip + requirements.txt (.venv present), plain OpenAI SDK (no framework), entrypoint agent.py, no existing telemetry.
Ingest base URL: https://agent-score-ingest.product.tricentis.com (default, confirmed). Ingest key: not created yet.

Instrumentation
- OpenInference OpenAI instrumentor (`openinference-instrumentation-openai`): default choice, includes prompt/response text.
- Manual spans needed (plain SDK code): one root `invoke_agent` span around `run()`, one `execute_tool` span around the tool dispatch line.

Dependencies to append to requirements.txt (none are present today):
- opentelemetry-sdk
- opentelemetry-exporter-otlp-proto-http
- openinference-instrumentation-openai
- python-dotenv (the project does not load .env otherwise)
Then `pip install -r requirements.txt` in .venv.

Files
- NEW agentscore_otel.py: bootstrap (marker line 1, service name `order-support-agent`, OpenAI instrumentor).
- agent.py: one `import agentscore_otel` line before `from openai import OpenAI`; `run()` wrapped by a root span (original body kept as `_run`); tool dispatch wrapped in a tool span.
- requirements.txt: lines above.
- .gitignore (new): covers `.env` and `.agentscore-spans.jsonl`.
- .env.example: managed AgentScore block with `tk_REPLACE_ME` placeholder.
- .env: non-secret settings only (endpoint, service name). The key is added by the user.

What will run
1. Local run of the agent in console mode (against the local OpenAI stub), then span_tree.py and wire_check.py (local receiver, made-up key).
2. No real send: the user has no ingest key yet. Next steps for the user: create a key in AgentScore (Integrations), add it with the `!` command, then run the agent once to send a real trace.

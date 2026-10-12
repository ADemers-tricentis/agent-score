# AgentScore setup report

Detected: Python, pip + requirements.txt (uv-created .venv without pip), plain OpenAI SDK, entrypoint agent.py, no prior telemetry.
Ingest URL: https://agent-score-ingest.product.tricentis.com (traces path /external/otel/v1/traces).

Changed/created in project:
- agentscore_otel.py (new bootstrap, service name order-support-agent, OpenInference OpenAI instrumentor)
- agent.py: `import agentscore_otel` before openai import; root invoke_agent span (run wraps _run); execute_tool span around tool dispatch
- requirements.txt: opentelemetry-sdk, opentelemetry-exporter-otlp-proto-http, openinference-instrumentation-openai, python-dotenv
- .gitignore (.env, .agentscore-spans.jsonl), .env.example (placeholder tk_REPLACE_ME only), .env (endpoint + service name only, git-ignored)
Deps were installed with `uv pip` since the venv has no pip.

Verification (ran, against local stub OpenAI server; no real traces sent):
- Console mode + span_tree.py: PASS (1 trace: invoke_agent > ChatCompletion, execute_tool lookup_order, ChatCompletion).
- wire_check.py: all PASS (path, bearer header from env, protobuf body).
- Idempotency pass: already_set_up detected, nothing changed.
Span file removed afterwards.

Not done / next step: no ingest key exists. Create one in AgentScore > Integrations, then run the `!` command from the skill's endpoint-and-auth reference to add OTEL_EXPORTER_OTLP_TRACES_HEADERS to .env, then run the agent once without AGENTSCORE_EXPORTER and look under Agents for "Learning your agent". Real send not performed. No WARN lines.

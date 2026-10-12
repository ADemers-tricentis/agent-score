# AgentScore setup report

Detected: Python, uv, LangGraph + langchain-openai, entrypoint main.py, no prior telemetry.
Ingest base URL: https://agent-score-ingest.product.tricentis.com (traces path /external/otel/v1/traces).

Files created/changed:
- agentscore_otel.py (new bootstrap, service name research-agent, OpenInference LangChain instrumentor covering LangGraph; no manual spans needed)
- main.py: one line `import agentscore_otel` before third-party imports
- pyproject.toml, uv.lock: added opentelemetry-sdk, opentelemetry-exporter-otlp-proto-http, openinference-instrumentation-langchain, python-dotenv
- .gitignore (.env, .agentscore-spans.jsonl), .env.example (placeholder tk_REPLACE_ME), .env (endpoint + service name only, no key)

Verification (ran, against the local stub OpenAI server, nothing sent to the real ingest):
- Console run + span_tree.py: RESULT passed (root LangGraph span, 2 LLM spans with model/tokens/prompt, 1 tool span lookup_order, identity signal, no noise, no key).
- wire_check.py: all PASS (path, bearer from env, protobuf body).
- .agentscore-spans.jsonl deleted afterward.
Note: LangGraph deprecation warning for create_react_agent is pre-existing and harmless.

Idempotency: second pass detected already_set_up, re-ran configure_env.py and uv add (no-ops), re-verified; no project file changed.

Next step for the user: add the ingest key (tk_...) yourself, created under Integrations in AgentScore, using the `!` hidden-input command from references/endpoint-and-auth.md (it appends OTEL_EXPORTER_OTLP_TRACES_HEADERS to .env). Then run the agent once without AGENTSCORE_EXPORTER to send a real trace (not done: no key, not yet confirmed). In AgentScore, open Agents: it shows Setting up, then Learning your agent (n of 20 traces); scoring starts after ~20 traces, so run realistic traffic including failures.

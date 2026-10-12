# AgentScore setup report

Detected: Python, uv, LangGraph/LangChain (langchain-openai), entrypoint main.py, no prior telemetry.
Ingest URL: https://agent-score-ingest.product.tricentis.com (given by user); traces URL ends /external/otel/v1/traces.

Files created: agentscore_otel.py (bootstrap, service name research-agent, OpenInference LangChainInstrumentor), .env.example (tk_REPLACE_ME placeholder), .gitignore (.env, .agentscore-spans.jsonl), .env (git-ignored; endpoint + service name only, no key), uv.lock.
Files changed: main.py (one import line before third-party imports), pyproject.toml.
Dependencies added (uv add): opentelemetry-sdk, opentelemetry-exporter-otlp-proto-http, openinference-instrumentation-langchain, python-dotenv.
Manual spans: none needed.

Verification (ran, against local stub OpenAI server; nothing sent to the real ingest):
- Console run + span_tree.py: PASSED all checks (root LangGraph span, 2 LLM spans with model/tokens/prompt, 1 tool span lookup_order, identity, no noise, no key).
- wire_check.py: all PASS (path /external/otel/v1/traces, bearer from env, protobuf body).
- .agentscore-spans.jsonl deleted afterwards.
Note: LangGraphDeprecatedSinceV10 warning for create_react_agent is pre-existing, unrelated.

Not done: no ingest key exists, so no real send. Next step for the user: create a key under Integrations in AgentScore, add it to .env with the `!` command from the skill (hidden-input prompt), then run `.venv/bin/python main.py` with real traffic; the agent shows under Agents as Setting up, then Learning your agent (n of 20 traces).

Idempotency: second pass detected already_set_up, re-ran configure_env.py and uv add; no file changed (hash compare).

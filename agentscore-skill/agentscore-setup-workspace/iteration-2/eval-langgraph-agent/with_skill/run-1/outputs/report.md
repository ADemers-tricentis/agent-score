# AgentScore setup report (langgraph order-support agent)

Detected: Python, uv, LangGraph prebuilt ReAct agent with langchain-openai, entrypoint main.py, no prior telemetry.

Files created: agentscore_otel.py (bootstrap, service name order-support-agent, LangChainInstrumentor), .env.example (placeholder key tk_REPLACE_ME), .env (endpoint and service name only, no key), .gitignore (.env, .agentscore-spans.jsonl).
Files changed: main.py (one import line before third-party imports), pyproject.toml and uv.lock.
Dependencies added via uv: opentelemetry-sdk, opentelemetry-exporter-otlp-proto-http, openinference-instrumentation-langchain, python-dotenv.
Manual spans: none needed.

Verification (ran, against local stub OpenAI server): span_tree.py passed all checks (root LangGraph span, 2 LLM spans with model, tokens and prompt text, 1 tool span lookup_order, identity signal, no noise, no key). wire_check.py passed (path /external/otel/v1/traces, bearer header from env, protobuf body). Nothing was sent to AgentScore. Stub stopped, span file deleted.
Warn: LangGraph deprecation warning for create_react_agent (pre-existing, unrelated).
Idempotency: second full pass changed no files (idempotency.json: changed = []).

Next steps for the user:
1. Create an ingest key in AgentScore under Integrations.
2. Add it to .env with the hidden-input command: `! printf 'AgentScore ingest key (tk_...): '; stty -echo; read k; stty echo; echo; printf 'OTEL_EXPORTER_OTLP_TRACES_HEADERS=Authorization=Bearer%%20%s\n' "$k" >> .env; unset k`
3. Run `uv run python main.py` (with real LLM credentials) and confirm sending a real trace; then check Agents in AgentScore for "Setting up" / "Learning your agent". Scoring starts after about 20 realistic traces.

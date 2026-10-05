# AgentScore setup report

Detected: Python, uv, LangGraph prebuilt ReAct agent (langchain-openai), entrypoint main.py, no prior telemetry.

Files created: agentscore_otel.py (bootstrap, service name research-agent, LangChainInstrumentor), .env.example (managed block, tk_REPLACE_ME placeholder), .gitignore (.env, .agentscore-spans.jsonl).
Files changed: main.py (one import line, first project import), pyproject.toml and uv.lock.
Dependencies added (uv add): opentelemetry-sdk, opentelemetry-exporter-otlp-proto-http, openinference-instrumentation-langchain, python-dotenv.
Manual spans: none needed.

Verification: RAN in console mode against the local stub. span_tree.py passed all checks (root LangGraph span, 2 LLM spans with model, tokens, prompt text, 1 tool span lookup_order, identity signal, no noise, no key). No WARNs. Span file deleted. Stub stopped. Nothing sent to AgentScore.

Idempotency: second pass (detect reported already_set_up, configure_env unchanged, no dependency or import duplication, re-verified passing) changed no files: OUTPUTS/idempotency.json = {"changed": []}.

Next steps for the user:
1. Create an ingest key (tk_...) in AgentScore under Integrations.
2. Add it to .env with the hidden-input command (run with the ! prefix), which appends OTEL_EXPORTER_OTLP_TRACES_HEADERS=Authorization=Bearer%20<key>. Also copy the endpoint and OTEL_SERVICE_NAME lines from .env.example into .env.
3. Run the agent once without AGENTSCORE_EXPORTER (with real LLM credentials). Watch stderr for 401/403/429/503.
4. In AgentScore, open Agents: it shows Setting up, then Learning your agent (n of 20 traces). Scoring starts around 20 traces; send realistic traffic including failures.

Notes: a stray __pycache__/ in the project is untracked and not in .gitignore (pre-existing behavior of the skill's gitignore entries); nothing committed.

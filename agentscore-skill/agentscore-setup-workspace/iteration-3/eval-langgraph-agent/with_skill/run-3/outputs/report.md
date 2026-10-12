# AgentScore setup report

**Detected:** Python, uv, LangGraph + LangChain (langchain-openai), entrypoint main.py, existing .venv, no prior telemetry.
**Ingest URL:** https://agent-score-ingest.product.tricentis.com (traces path /external/otel/v1/traces).

**Files created/changed:**
- agentscore_otel.py (new bootstrap, service name research-agent, OpenInference LangChain instrumentor)
- main.py (one import line `import agentscore_otel`, placed before the third-party imports)
- pyproject.toml, uv.lock (dependencies)
- .gitignore (.env, .agentscore-spans.jsonl), .env.example (placeholder tk_REPLACE_ME only), .env (endpoint + service name, git-ignored; no key)

**Dependencies added (uv add):** opentelemetry-sdk, opentelemetry-exporter-otlp-proto-http, openinference-instrumentation-langchain, python-dotenv. No manual spans needed.

**Verification (ran, against local stub OpenAI server, nothing sent to the real ingest):**
- Console-mode run + span_tree.py: all checks PASS (root LangGraph span, 2 LLM spans with model/tokens/prompt, 1 tool span lookup_order, identity, no noise, no key in data).
- wire_check.py: all PASS (path, bearer header from env, protobuf body).
- .agentscore-spans.jsonl deleted afterwards.
- WARN-ish note: LangGraph prints a deprecation warning for create_react_agent (pre-existing, unrelated).

**Not done / next steps for the user:**
1. Create an ingest key in AgentScore (Integrations) and add it to .env with the `!` hidden-input command from the skill (OTEL_EXPORTER_OTLP_TRACES_HEADERS). No key exists, so no real trace was sent.
2. Then run the agent with a real OPENAI_API_KEY (without AGENTSCORE_EXPORTER) and check Agents in AgentScore for "Learning your agent" (n of 20 traces); run realistic traffic including failures.

**Re-run check:** second pass reported already_set_up, configure_env.py made no changes, verification re-passed, file hashes unchanged (idempotency.json: no changes).

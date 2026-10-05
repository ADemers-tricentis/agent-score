# AgentScore setup report

Detected: Python, pip + requirements.txt (uv-created .venv), plain OpenAI SDK, entrypoint agent.py, no prior telemetry.
Ingest base URL: https://agent-score-ingest.product.tricentis.com (traces path /external/otel/v1/traces).

Changes
- New: agentscore_otel.py (bootstrap, service name order-support-agent, OpenInference OpenAI instrumentor), .gitignore (.env, .agentscore-spans.jsonl), .env.example (placeholder tk_REPLACE_ME), .env (endpoint + service name only, no key).
- agent.py: `import agentscore_otel` before the OpenAI import; root `invoke_agent` span (run() wraps the original body, now _run()); `execute_tool` span around the tool dispatch.
- requirements.txt: opentelemetry-sdk, opentelemetry-exporter-otlp-proto-http, openinference-instrumentation-openai, python-dotenv. The venv had no pip, so installed with `uv pip install --python .venv/bin/python -r requirements.txt`.

Verification (ran, against the local OpenAI stub; nothing sent to AgentScore)
- Console mode: one trace, 4 spans (agent, LLM, tool, LLM); span_tree.py all PASS.
- wire_check.py: all PASS (path, bearer header from env, protobuf body).
- Span file deleted afterwards; stub stopped.

Idempotency: second pass (detect reports already_set_up, configure_env no-ops, no dependency or code edits, re-verified) changed no files; see idempotency.json ({"changed": []}).

Next steps for the user
1. Create an ingest key in AgentScore, Integrations.
2. From the project dir, run (with the ! prefix) the hidden-input command from the skill to append OTEL_EXPORTER_OTLP_TRACES_HEADERS to .env.
3. Run `python agent.py` once without AGENTSCORE_EXPORTER; watch stderr for 401/403/429/503.
4. In AgentScore, open Agents: the agent shows as Setting up, then Learning your agent (n of 20 traces). Run realistic traffic, including failures.

Notes: no WARN lines. Real export was not tested (no key). Nothing committed.

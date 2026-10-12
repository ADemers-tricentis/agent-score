# AgentScore setup report: order-support-agent

Detected: Python, pip + requirements.txt (.venv, installed with `uv pip` since the venv has no pip), plain OpenAI SDK, entrypoint agent.py, no prior telemetry.

Changed/created (project/):
- agentscore_otel.py (new bootstrap, OpenInference OpenAI instrumentor, service name order-support-agent)
- agent.py: `import agentscore_otel` placed before `from openai import OpenAI`; root span `invoke_agent order-support-agent` wrapping run() (original body renamed `_run`); `execute_tool` span around tool dispatch
- requirements.txt: opentelemetry-sdk, opentelemetry-exporter-otlp-proto-http, openinference-instrumentation-openai, python-dotenv
- .gitignore (.env, .agentscore-spans.jsonl), .env.example (placeholder tk_REPLACE_ME), .env (endpoint https://agent-score-ingest.product.tricentis.com/external/otel/v1/traces and service name only; no key)

Verification (ran, against the local stub OpenAI server, no real send):
- Console mode + span_tree.py: RESULT passed. One trace: AGENT invoke_agent > LLM, TOOL execute_tool lookup_order, LLM.
- wire_check.py: all PASS (path /external/otel/v1/traces, bearer header from env, protobuf body).
- Note: stub ports reported "address in use" on my launch, but a stub was already answering; results matched the stub's canned reply.
- Spans file deleted afterwards.

Not done: no ingest key exists and no real trace was sent.
Next step for the user: create a key under Integrations in AgentScore, add it to .env with
`! printf 'AgentScore ingest key (tk_...): '; stty -echo; read k; stty echo; echo; printf 'OTEL_EXPORTER_OTLP_TRACES_HEADERS=Authorization=Bearer%%20%s\n' "$k" >> .env; unset k`
then run the agent without AGENTSCORE_EXPORTER and check Agents in AgentScore ("Learning your agent", n of 20 traces). Run realistic traffic including failures.

# AgentScore setup report - order-support agent

Detected: Python, pip + requirements.txt (uv-created .venv), plain OpenAI SDK, entrypoint agent.py, no prior telemetry.

Files created: agentscore_otel.py (bootstrap, OpenInference OpenAI instrumentor, service name order-support-agent), .env.example (placeholder tk_REPLACE_ME only), .gitignore (.env, .agentscore-spans.jsonl), .env (git-ignored; endpoint + service name only, no key).
Files changed: agent.py (import agentscore_otel before openai import; root invoke_agent span around run() via _run; execute_tool span around the tool dispatch), requirements.txt (+ opentelemetry-sdk, opentelemetry-exporter-otlp-proto-http, openinference-instrumentation-openai, python-dotenv).

Verification (ran, against the local stub OpenAI server; nothing sent to the real ingest URL):
- Console mode + span_tree.py: RESULT passed (root agent span, 2 LLM spans with model/tokens/prompt, 1 tool span, no key in data).
- wire_check.py: all PASS (path /external/otel/v1/traces, bearer header from env, protobuf body).
- .agentscore-spans.jsonl deleted afterwards.
Not done: no real send. No ingest key exists.

Next step for the user: create an ingest key under Integrations in AgentScore, then add it to .env with the hidden-input command:
! printf 'AgentScore ingest key (tk_...): '; stty -echo; read k; stty echo; echo; printf 'OTEL_EXPORTER_OTLP_TRACES_HEADERS=Authorization=Bearer%%20%s\n' "$k" >> .env; unset k
Then run the agent without AGENTSCORE_EXPORTER and open Agents in AgentScore (Setting up, then "n of 20 traces"; scoring starts after about 20 traces; send realistic traffic including failures).

Idempotency re-run: detect.py reported already_set_up; configure_env.py reported nothing to change; re-verification passed again; no project files changed.

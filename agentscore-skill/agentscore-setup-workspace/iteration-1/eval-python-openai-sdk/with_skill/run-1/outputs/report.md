# AgentScore setup report

Detected: Python, pip (requirements.txt, .venv), plain OpenAI SDK, entrypoint agent.py, no prior telemetry.

Files created: agentscore_otel.py (bootstrap, service name order-support-agent, OpenInference OpenAI instrumentor), .env.example (managed block, tk_REPLACE_ME placeholder), .gitignore (.env, .agentscore-spans.jsonl).
Files changed: agent.py (first-project import of agentscore_otel; root invoke_agent span around run(), original body renamed _run; execute_tool span around the tool dispatch), requirements.txt (+4 lines).
Dependencies added: opentelemetry-sdk, opentelemetry-exporter-otlp-proto-http, openinference-instrumentation-openai, python-dotenv. The venv had no pip (uv-style), so they were installed with `uv pip install --python .venv/bin/python -r requirements.txt`.

Verification: ran the agent once in console mode against the local stub OpenAI server. span_tree.py: all checks PASS (one trace, 4 spans: AGENT > LLM, TOOL, LLM). Nothing was sent anywhere; spans file deleted; stub stopped.
Idempotency: second pass (detect reported already_set_up, configure_env unchanged, deps present, import present, re-verified) changed no files; idempotency.json = {"changed": []}.

Next steps for the user: create an ingest key in AgentScore (Integrations), then add it to .env with the hidden-input `!` command from the skill (never paste it in chat), then run the agent without AGENTSCORE_EXPORTER to send a real trace. In AgentScore > Agents it appears as Setting up, then Learning your agent (n of 20 traces); scoring starts after about 20 traces, so run realistic traffic including failures.
Not committed. __pycache__ is untracked in the project (not covered by .gitignore).

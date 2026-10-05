# AgentScore setup plan

Detected
- Language: Python, package manager pip (requirements.txt, venv at .venv)
- Framework: none (plain code). LLM SDK: openai (chat.completions with a tool loop)
- Entrypoint: agent.py (only candidate, has `if __name__ == "__main__"`)
- No existing telemetry, no .env, no .env.example, no .gitignore

Connection
- Ingest base URL: https://agent-score-ingest.product.tricentis.com
- Traces URL: https://agent-score-ingest.product.tricentis.com/external/otel/v1/traces
- No ingest key yet. The user creates one in AgentScore (Integrations) and adds it to .env themselves with the `!` command. I never see or write it.

Instrumentation
- OpenInference OpenAI instrumentor (`openinference-instrumentation-openai`): default choice, includes prompt/response text.
- Manual spans needed (plain SDK code): one root `invoke_agent` span around `run()`, one `execute_tool` span around the DISPATCH call. Instrumentor only gives one-span traces per LLM call otherwise.

Dependencies to append to requirements.txt (unpinned, project pins only a floor)
- opentelemetry-sdk
- opentelemetry-exporter-otlp-proto-http
- openinference-instrumentation-openai
- python-dotenv (project does not load .env itself)

Files
- .gitignore (new): covers .env and .agentscore-spans.jsonl (done first)
- .env.example (new): managed AgentScore block with tk_REPLACE_ME placeholder only
- requirements.txt: 4 lines appended
- agentscore_otel.py (new): bootstrap from template, service name `order-support-agent`, OpenAI instrumentor
- agent.py: add `import agentscore_otel` as first project import; wrap `run()` body in root span (original renamed `_run`), wrap tool dispatch line in a tool span

Run
1. One local run with AGENTSCORE_EXPORTER=console against a local stub OpenAI server, then span_tree.py. Nothing is sent anywhere. Delete the spans file afterwards.
2. Stop there. Real export only after the user adds a key and confirms.

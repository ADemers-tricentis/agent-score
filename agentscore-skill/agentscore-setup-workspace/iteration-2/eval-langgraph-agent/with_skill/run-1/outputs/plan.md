# AgentScore setup plan

**Detected**
- Language: Python (uv project, .venv, uv.lock). Framework: LangGraph prebuilt ReAct agent via langchain-openai (OpenAI-compatible). Entrypoint: main.py.
- No existing telemetry. No .env, .env.example or .gitignore yet.

**Connection**
- Ingest base URL: https://agent-score-ingest.product.tricentis.com (traces go to /external/otel/v1/traces, protobuf).
- Ingest key: not created yet. I will never write or see it; you add it yourself later (Integrations in the AgentScore UI, then a hidden-input `!` command).

**Instrumentation**
- `openinference-instrumentation-langchain` (one instrumentor covers LangChain and LangGraph; gives chain, agent, LLM and tool spans). No OpenAI instrumentor (would duplicate LLM spans). No manual spans at first; added only if span_tree.py shows a gap.

**Dependencies (uv add)**
- opentelemetry-sdk
- opentelemetry-exporter-otlp-proto-http
- openinference-instrumentation-langchain
- python-dotenv (project does not load .env itself)

**Files**
- New: agentscore_otel.py (bootstrap, service name `order-support-agent`, LangChain instrumentor)
- Changed: main.py (one line: `import agentscore_otel  # noqa: F401` before the third-party imports)
- Changed: pyproject.toml, uv.lock (dependencies)
- New: .gitignore (covers .env and .agentscore-spans.jsonl), .env.example (placeholders, `tk_REPLACE_ME`), .env (endpoint and service name only, no key)

**What will run**
1. Local run with AGENTSCORE_EXPORTER=console against a local stub OpenAI server, then span_tree.py.
2. wire_check.py transport check against a local receiver (made-up key).
3. Stop there. No real send until you add your key and confirm.

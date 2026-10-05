# AgentScore setup plan

Detected
- Language: Python, package manager uv (.venv present), project name `research-agent`
- Framework: LangGraph prebuilt ReAct agent (langchain-openai / ChatOpenAI, OpenAI-compatible API)
- Entrypoint: main.py (`if __name__ == "__main__"`)
- Existing telemetry: none. No .env, .env.example or .gitignore yet.

Instrumentation
- OpenInference `openinference-instrumentation-langchain` (one instrumentor covers LangChain and LangGraph; no separate OpenAI instrumentor, it would duplicate LLM spans).
- Manual spans: none to start with. LangGraph traces its own agent/LLM/tool structure; add wrappers only if span_tree.py reports a gap.

Dependencies to add (uv add, updates pyproject.toml and uv.lock)
- opentelemetry-sdk
- opentelemetry-exporter-otlp-proto-http
- openinference-instrumentation-langchain
- python-dotenv (project does not load .env anywhere else)

Files
- NEW agentscore_otel.py: bootstrap from the skill template, service name `research-agent`, LangChainInstrumentor
- CHANGE main.py: one line, `import agentscore_otel  # noqa: F401` as first project import
- NEW .env.example: managed block with endpoint https://agent-score-ingest.product.tricentis.com/external/otel/v1/traces and `tk_REPLACE_ME` placeholder
- NEW .gitignore: `.env`, `.agentscore-spans.jsonl`
- pyproject.toml / uv.lock: dependency additions

What will run
1. One local run in console mode (AGENTSCORE_EXPORTER=console, stub OpenAI server), then span_tree.py; span file deleted afterwards.
2. No real export: no ingest key exists yet. After the user creates a key (AgentScore UI, Integrations) and adds it to .env via the hidden-input `!` command, they run the agent once to send a real trace.

The ingest key is never written, printed or passed by me.

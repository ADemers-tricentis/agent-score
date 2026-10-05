# Python setup

Template: `assets/agentscore_otel.py`. Copy it into the project (next to the entrypoint or inside the
app package), replace `__SERVICE_NAME__` with the agent's name, and replace the `# __INSTRUMENTORS__`
line with the instrumentor lines for this project. Keep the `agentscore-setup:v1` marker on line 1: it is
how a second run recognizes that setup already happened.

## Packages

Always: `opentelemetry-sdk`, `opentelemetry-exporter-otlp-proto-http`.
Plus the instrumentor packages from `instrumentors.md`.
Plus `python-dotenv` only if the project does not already load `.env` some other way (the template reads
`.env` when `dotenv` is importable and silently skips it otherwise).

Install with the project's own tool, and show the user the lines you are about to add first:

| Detected | Add dependencies | Notes |
|---|---|---|
| `uv` (uv.lock or `[tool.uv]`) | `uv add <pkgs>` | updates `pyproject.toml` and `uv.lock` |
| `poetry` | `poetry add <pkgs>` | |
| `pipenv` | `pipenv install <pkgs>` | |
| `pip` + requirements.txt | append the names to `requirements.txt`, then `pip install -r requirements.txt` in the project's venv | if no venv exists, ask before creating one |
| `pip` + pyproject (PEP 621) | add to `[project] dependencies`, then `pip install -e .` | |

Before running anything, check each package is not already in the manifest (idempotency), and prefer
unpinned names unless the project pins everything. After installing, show `git diff` of the manifest and
lockfile.

If a venv exists (`.venv`, `venv`), use its interpreter for all runs.

## Wiring the bootstrap

Import it in the entrypoint after the standard-library imports and before any third-party import (OpenAI,
LangChain, ...), so tracing is in place before clients exist. Keep the user's import ordering style otherwise:

```python
import agentscore_otel  # noqa: F401  (must load before any LLM client is created)
```

Entrypoint selection:
- A script or CLI: the file with `if __name__ == "__main__"`.
- A web app (FastAPI, Flask): the module that creates the app, or the package `__init__` if the app is
  created in a factory. Not a per-request handler.
- If several candidates exist, ask the user which file is the real entrypoint.

Do not wrap the whole app in extra functions or restructure imports. One import line is the change.

If the project already configures OpenTelemetry (`detect.py` lists `existing_otel_setup_files`), the
template attaches a second span processor to the existing provider instead of creating one. Say so in the
plan: the user's existing exporter keeps working and AgentScore receives a copy.

## Instrumentor lines (go where `# __INSTRUMENTORS__` is)

Always pass `tracer_provider=provider` (the variable the template defines).

```python
# OpenAI SDK
from openinference.instrumentation.openai import OpenAIInstrumentor
OpenAIInstrumentor().instrument(tracer_provider=provider)

# Anthropic
from openinference.instrumentation.anthropic import AnthropicInstrumentor
AnthropicInstrumentor().instrument(tracer_provider=provider)

# LangChain and LangGraph (one instrumentor covers both)
from openinference.instrumentation.langchain import LangChainInstrumentor
LangChainInstrumentor().instrument(tracer_provider=provider)

# LlamaIndex
from openinference.instrumentation.llama_index import LlamaIndexInstrumentor
LlamaIndexInstrumentor().instrument(tracer_provider=provider)

# OpenAI Agents SDK
from openinference.instrumentation.openai_agents import OpenAIAgentsInstrumentor
OpenAIAgentsInstrumentor().instrument(tracer_provider=provider)

# CrewAI (also instrument the underlying LLM SDK, per the CrewAI instrumentor docs)
from openinference.instrumentation.crewai import CrewAIInstrumentor
CrewAIInstrumentor().instrument(tracer_provider=provider)
```

A project that mixes a framework and its provider SDK (for example LangChain with `langchain-openai`)
needs only the framework instrumentor. Adding the OpenAI one as well would duplicate LLM spans.

Official OTel variant for OpenAI: `from opentelemetry.instrumentation.openai_v2 import OpenAIInstrumentor`
with `.instrument()`, plus the caveats and environment variables in `instrumentors.md`.

## When to add manual spans

- Plain SDK code (OpenAI, Anthropic, Gemini clients called directly): always add the root agent span and
  tool spans. Read `manual-spans.md`.
- Framework agents (LangGraph, CrewAI, Agents SDK, LlamaIndex): start without them, run `span_tree.py`,
  and add them only for the checks that fail (typically a custom tool dispatch the framework does not see).

## Running the agent for verification

Use the project's own run command. Set `AGENTSCORE_EXPORTER=console` and any credentials the agent needs
through the environment, never in the command text. If the agent needs a live LLM key the user has not
configured, do not guess or invent one: use the static check described in `SKILL.md`.

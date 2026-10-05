# Choosing an instrumentor

Three families of instrumentors produce spans AgentScore reads. They were compared by running each against
a stub OpenAI server and inspecting the spans; the results below are measured, not assumed. Package
versions move quickly, so re-check names on PyPI/npm when installing.

## Order of preference

1. **The instrumentor the project already uses.** If `detect.py` shows OpenInference, OpenLLMetry
   (`opentelemetry-instrumentation-<x>` at 0.x, `@traceloop/*`) or official OTel GenAI instrumentors, keep
   them and add the exporter. Do not add a second instrumentor for the same SDK: it double-counts every call.
2. **OpenInference** (`openinference-instrumentation-*`, `@arizeai/openinference-*`). Default choice.
   It worked with a single install and no configuration, and it includes prompt and response text.
3. **OpenLLMetry / Traceloop.** Works out of the box and emits `gen_ai.*` with content on the span.
4. **Official OpenTelemetry GenAI** (`opentelemetry-instrumentation-openai-v2`, `-google-genai`,
   `@opentelemetry/instrumentation-openai`). Use when the project already standardizes on it. See the
   caveats below; they cost real setup time.
5. **Hand-written spans** (`manual-spans.md`) when the SDK has no instrumentor, and in addition to any
   instrumentor whose coverage stops at the LLM call (the next section).

## What an instrumentor does not give you

An LLM-SDK instrumentor traces calls to the model API. It does not know about your agent loop or your
tool functions. For code that calls an SDK directly (plain OpenAI, Anthropic, Gemini clients), measured
result: every LLM call became its own one-span trace, with no agent span and no tool spans. Add one root
agent span around the entrypoint and one tool span per tool dispatch (`manual-spans.md`).

Agent *frameworks* usually trace their own structure, so no manual spans are needed:

| Framework | Result with OpenInference |
|---|---|
| LangGraph / LangChain | One trace per invoke with chain, agent, LLM and tool spans (measured) |
| Vercel AI SDK | Needs the OpenInference span processor; then agent, LLM and tool spans (measured) |
| OpenAI Agents SDK, CrewAI, LlamaIndex, Pydantic AI, Google ADK | Instrumentors exist and trace agents and tools; verify with `span_tree.py` |

## Package table

| SDK / framework | OpenInference | OpenLLMetry | Official OTel GenAI |
|---|---|---|---|
| OpenAI (py) | `openinference-instrumentation-openai` | `opentelemetry-instrumentation-openai` | `opentelemetry-instrumentation-openai-v2` (beta) |
| Anthropic (py) | `openinference-instrumentation-anthropic` | `opentelemetry-instrumentation-anthropic` | none |
| Google Gen AI (py) | `openinference-instrumentation-google-genai` | `opentelemetry-instrumentation-google-generativeai` | `opentelemetry-instrumentation-google-genai` |
| LangChain / LangGraph (py) | `openinference-instrumentation-langchain` | `opentelemetry-instrumentation-langchain` | none |
| LlamaIndex (py) | `openinference-instrumentation-llama-index` | `opentelemetry-instrumentation-llamaindex` | none |
| OpenAI Agents SDK (py) | `openinference-instrumentation-openai-agents` | none | none |
| CrewAI (py) | `openinference-instrumentation-crewai` | `opentelemetry-instrumentation-crewai` | none |
| LiteLLM (py) | `openinference-instrumentation-litellm` | none | none |
| Pydantic AI (py) | `openinference-instrumentation-pydantic-ai` | none | none |
| OpenAI (node) | `@arizeai/openinference-instrumentation-openai` | `@traceloop/instrumentation-openai` | `@opentelemetry/instrumentation-openai` |
| Anthropic (node) | `@arizeai/openinference-instrumentation-anthropic` | `@traceloop/instrumentation-anthropic` | none |
| LangChain.js (node) | `@arizeai/openinference-instrumentation-langchain` | `@traceloop/instrumentation-langchain` | none |
| Vercel AI SDK (node) | `@arizeai/openinference-vercel` (span processor, version depends on `ai` major) | none | `@ai-sdk/otel` for `ai` v7 (needs the OpenInference processor too) |

Every package name above was confirmed to exist on PyPI/npm. Only the OpenAI (py), LangChain/LangGraph
(py) and Vercel AI SDK rows were run end to end; the others are untested here, so run `span_tree.py` on
them and fix what it reports. If an install fails with "not found", look the package up rather than
guessing a similar name. Bedrock also has `openinference-instrumentation-bedrock` and
`opentelemetry-instrumentation-bedrock`. Older guidance listed `opentelemetry-instrumentation-openai` as
the official package; it is OpenLLMetry's, and the official one is `-openai-v2`.

## Measured caveats

- **`opentelemetry-instrumentation-openai-v2` (2.4b0):** import failed until `httpx` and
  `opentelemetry-util-genai==0.4b0` were installed (the newest util-genai was incompatible). It also
  records no prompt or response text by default. To get content onto spans set
  `OTEL_INSTRUMENTATION_GENAI_CAPTURE_MESSAGE_CONTENT=SPAN_ONLY` (`true` is rejected) and
  `OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental`. `configure_env.py --family otel` writes both.
  Without content, scoring has nothing to judge, and `span_tree.py` fails the "prompt content" check.
- **Vercel AI SDK v7 without the OpenInference processor** emits `gen_ai.operation.name=agent_step`, which
  AgentScore rejects, failing the whole trace. Always use the OpenInference processor with it.
- **Vercel AI SDK v5/v6 without the processor** puts prompts under `ai.*` keys AgentScore does not read,
  and `ai.toolCall` is not recognized as a tool. Again, use the processor.
- **Python wiring:** pass the provider explicitly, `Instrumentor().instrument(tracer_provider=provider)`, so the
  instrumentor does not depend on the global provider having been set first. The bootstrap module is imported
  before the agent code, so instrumentation is in place before any client is created.

# What AgentScore reads from a span

AgentScore does not need a special SDK. It reads standard OpenTelemetry spans and recognizes three
attribute families: OpenInference (`openinference.*`, `llm.*`, `input.value`), OpenTelemetry GenAI
(`gen_ai.*`) and OpenLLMetry/Traceloop (`traceloop.*`). Langfuse-style `langfuse.observation.type` is also
honored. Nothing in this skill should emit anything outside these families.

Treat a trace as a **run**. One trace should be one execution of the agent (one question answered, one
task completed). `session.id` is optional grouping across runs, not the run boundary.

## What a scoreable trace needs

| Need | Why | How it is read (first match wins) |
|---|---|---|
| A root span for the run | Without it each LLM call becomes its own one-span trace and nothing is scored as a run | Any span with no parent. Frameworks create one; plain SDK code needs a manual one. |
| LLM spans with model, prompt and response | The conversation turns being judged | model: `gen_ai.request.model`, `llm.model_name`. Input/output: `traceloop.entity.input/output`, `input.value`/`output.value`, `llm.input_messages.*`/`llm.output_messages.*`, `gen_ai.input.messages`/`gen_ai.output.messages` |
| Token counts | Cost and efficiency views | `gen_ai.usage.input_tokens`/`output_tokens`, `llm.token_count.prompt`/`completion`, plus cache and reasoning variants |
| Tool spans, one per tool dispatch | Tool-use scoring: what was called, with what, and whether it worked | A span typed TOOL (see below) whose name or `tool.name`/`gen_ai.tool.name` is the tool; input and output as above |
| An agent identity signal | Recognizing which agent this is, and recognizing it again next time | Any of: `gen_ai.agent.name`, `agent.name`, `gen_ai.agent.id`, `traceloop.workflow.name`/`traceloop.entity.name`, the set of tool names, `gen_ai.system_instructions`, or `service.name` as a fallback |

An agent without any identity signal is recorded as an ingestion failure rather than scored. Setting
`OTEL_SERVICE_NAME` always satisfies the fallback, which is why the bootstrap sets it.

## How a span's type is decided

Highest priority first:

1. `langfuse.observation.type`: `span`, `generation`, `event`, `embedding`, `agent`, `tool`, `chain`
2. `openinference.span.kind`: `AGENT`, `LLM`, `TOOL`, `CHAIN`, `RETRIEVER`, `RERANKER`, `EMBEDDING`, `GUARDRAIL`, `EVALUATOR`, `PROMPT`
3. `gen_ai.operation.name`
4. Heuristics: `tool.name` present means TOOL; `gen_ai.request.model`/`llm.model_name`/`gen_ai.input.messages` means LLM

A declared type that AgentScore does not know is kept but ignored for scoring. **The exception is
`gen_ai.operation.name`: an unrecognized value fails the entire trace.** Accepted values:
`chat`, `completion`, `text_completion`, `generate_content`, `generate`, `embeddings`, `invoke_agent`,
`create_agent`, `execute_tool`.

Because OpenInference and Langfuse types outrank `gen_ai.operation.name`, a span that carries a custom
operation name is safe as long as it also carries `openinference.span.kind`. Vercel AI SDK v7 emits
`gen_ai.operation.name=agent_step` on its step spans; the OpenInference processor adds
`openinference.span.kind=CHAIN` to them, which is why that processor is required there.

## Noise AgentScore drops

HTTP client, Redis, database and ASGI/web-framework spans are filtered out as infrastructure. Installing
`httpx`, `requests`, `fastapi` or database instrumentors adds no value for scoring and can only add noise.
Do not add them.

## Tool-failure signal

`http.status_code >= 400` or `tais.tool.success=false` marks a tool call as failed. For your own tool
spans, also set the span status to ERROR and call `record_exception` so the failure is visible in the trace
tree. Absence of a failure signal is not read as success; it is read as unknown.

## Not verified

- The "scoring starts after about 20 traces" threshold comes from AgentScore's customer docs. It was not
  found in the ingest or trace-store code, so say "about 20" and attribute it to the docs.
- `gen_ai.input.messages` in the newer `parts` format (emitted by current OpenLLMetry and the official OTel
  OpenAI instrumentor) is read by the mapper, but how well its content renders in the UI was not verified.
  OpenInference's `input.value`/`llm.input_messages.*` is the best-established path.

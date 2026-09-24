---
name: agent-score-semantic-conventions
description: Span attributes Agent Score recognizes, so a brand-new agent's traces are discovered and scored, not just ingested.
---

# Span attributes Agent Score recognizes

Getting traces to arrive is only half the job. Agent Score reads span
**attributes**, not raw span names, to work out what each span is (an agent
turn, a tool call, a generation) and to score the agent. A trace with no
recognized attributes still ingests, but the agent may not resolve cleanly or
score well.

**Fastest path: use an instrumentation library.** If the app is instrumented
with the Langfuse SDK, OpenLLMetry (Traceloop), or OpenInference, these
attributes are emitted for you - prefer that over hand-rolling spans. Set the
attributes below manually only when the app emits custom spans and no
instrumentation library fits.

Agent Score recognizes three overlapping conventions. Emitting the Langfuse
convention plus the GenAI convention covers the common cases (Agent Card
rendering + tool detection).

---

## 1. Langfuse convention - drives the Agent Card and trace rendering

Ingested traces are forwarded into the agent's Langfuse project, and the Agent
Card / trace view read Langfuse's observation model. A span is only recognized
as a tool call, generation, or agent turn if it carries these:

| Attribute | Purpose |
|---|---|
| `langfuse.observation.type` | What the span is. Valid values: `span`, `agent`, `tool`, `chain`, `retriever`, `evaluator`, `guardrail`, `generation`, `embedding` |
| `langfuse.observation.input` | Observation input (JSON string) |
| `langfuse.observation.output` | Observation output (JSON string) |
| `langfuse.observation.level` | Level (e.g. `DEFAULT`, `ERROR`) |
| `langfuse.observation.status_message` | Error / status detail |
| `langfuse.observation.model.name` | Model name for a generation |
| `langfuse.observation.usage_details` | Token usage, JSON `{"input", "output", "total"}` |
| `langfuse.observation.cost_details` | USD cost, JSON `{"input", "output", "total"}` |
| `langfuse.trace.input` | Trace-level input (set on the root span) |
| `langfuse.trace.output` | Trace-level output (set on the root span) |
| `session.id` | Groups spans/traces into one session |

Non-string values (usage/cost, structured input/output) must be JSON-encoded
strings.

## 2. GenAI semantic convention - drives capability detection (`has_tools`)

Agent Score's profile-fit logic reads these to decide what the agent can do.
A `type=="TOOL"` observation, **or** `gen_ai.operation.name="execute_tool"`
together with `gen_ai.tool.name`, reliably sets `has_tools=True`.

| Attribute | Notes |
|---|---|
| `gen_ai.agent.name` | Agent name |
| `gen_ai.operation.name` | `invoke_agent` \| `chat` \| `execute_tool` |
| `gen_ai.request.model` | Model requested |
| `gen_ai.system_instructions` | System prompt |
| `gen_ai.tool.name` | Tool name (on tool-execution spans) |
| `gen_ai.usage.input_tokens` | Prompt tokens |
| `gen_ai.usage.output_tokens` | Completion tokens |

## 3. OpenInference convention - identity / fingerprint layer

A second, independent convention Agent Score's identity/fingerprint layer also
recognizes:

| Attribute | Notes |
|---|---|
| `openinference.span.kind` | `AGENT` \| `LLM` \| `TOOL` \| `RETRIEVER` \| `CHAIN` |
| `input` | Bare (non-namespaced) input |
| `output` | Bare (non-namespaced) output |
| `tool_definitions` | Available tool definitions |

---

## Minimal manual example (Python)

Only needed when no instrumentation library fits. Set both the Langfuse and
GenAI attributes on each span so the span is both rendered and scored.

```python
import json
from opentelemetry import trace

tracer = trace.get_tracer("my-agent")

# Root / agent-turn span
with tracer.start_as_current_span("agent.turn") as span:
    span.set_attribute("langfuse.observation.type", "agent")
    span.set_attribute("langfuse.trace.input", json.dumps({"question": user_input}))
    span.set_attribute("session.id", session_id)
    span.set_attribute("gen_ai.operation.name", "invoke_agent")
    span.set_attribute("gen_ai.agent.name", "my-agent")

    # A tool call - this is what sets has_tools=True
    with tracer.start_as_current_span("tool.search") as tool_span:
        tool_span.set_attribute("langfuse.observation.type", "tool")
        tool_span.set_attribute("gen_ai.operation.name", "execute_tool")
        tool_span.set_attribute("gen_ai.tool.name", "search_knowledge_base")
        tool_span.set_attribute("openinference.span.kind", "TOOL")
        tool_span.set_attribute("langfuse.observation.output", json.dumps(results))

    # A model generation - carries usage/cost so cost views populate
    with tracer.start_as_current_span("llm.generate") as gen_span:
        gen_span.set_attribute("langfuse.observation.type", "generation")
        gen_span.set_attribute("langfuse.observation.model.name", "claude-opus-4-8")
        gen_span.set_attribute("gen_ai.request.model", "claude-opus-4-8")
        gen_span.set_attribute("gen_ai.usage.input_tokens", in_tokens)
        gen_span.set_attribute("gen_ai.usage.output_tokens", out_tokens)
        gen_span.set_attribute(
            "langfuse.observation.usage_details",
            json.dumps({"input": in_tokens, "output": out_tokens, "total": in_tokens + out_tokens}),
        )

    span.set_attribute("langfuse.trace.output", json.dumps({"answer": answer}))
```

---

## Known gap: `has_retrieval` / RAG profiles

`has_retrieval` (needed for the RAG Starter scoring profile) requires
Langfuse's native `toolCalls` column to be populated, which happens inside
Langfuse's own OTel ingestion - it is not confirmed to work from raw OTel
spans alone. Attach the real retrieved-passage text to the retriever/tool
span's output regardless (Faithfulness/Groundedness evals read it), but for a
custom-instrumented agent the realistically achievable profile fit is
Tool/Orchestrator Starter (driven by a confirmed `has_tools` signal), not RAG
Starter.

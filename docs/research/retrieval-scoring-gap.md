# AgentScore: Groundedness / Retrieval Rag dimensions are structurally unreachable via raw OTel

## TL;DR

For a RAG-style agent (LLM + a retrieval tool) sending traces via the documented `/external/otel/v1/traces` OTel path, the **Groundedness** and **Retrieval Rag** dimensions never score - they're permanently excluded with `needs_retrieval_context`, regardless of span shape. Root cause: the gate requires Langfuse's native `toolCalls` field to be populated on an observation, and that field can only be populated from a chat-completion **generation's own output** (never a dedicated tool/retrieval span's input or output). But a generation deciding to call a tool doesn't have the retrieved content yet - so even in the one path that *can* set `toolCalls`, the resulting "retrieval context" would be the tool-call request, not retrieved passages. This isn't a trace-shaping bug on the sending side; it looks like a gap in how the ingestion pipeline connects retrieval tool execution to the Faithfulness/Groundedness eval's context requirement. Confirmed against Tricentis's own real production traces, not just synthetic test data.

## Setup / how we got here

Built a small RAG demo agent (`test-agent/`) - Claude + a `search_knowledge_base` tool over `docs/faq.md` - instrumented with OpenTelemetry, sending to a real `andrew-test-tenant` agent via `POST https://agent-score-ingest.product.tricentis.com/external/otel/v1/traces` with a `tk_...` tenant key. Wrote a synthetic-trace generator (`test-agent/send_synthetic_traces.py`) to send realistic batches (good answers + deliberate failure modes: hallucination, off-topic, safety leak, tool error, inconsistent answers) fast, without burning real LLM calls, to exercise the scoring engine.

Goal: get all six-ish dimensions (the active profile shows Relevance / Groundedness / Retrieval Rag - i.e. **RAG Starter**) scoring meaningfully.

## What we confirmed works

1. **`has_tools`** is reliably driven by either:
   - an observation with `type == "TOOL"` after Langfuse's projection ("typed" origin), or
   - the OpenInference/gen_ai pattern `gen_ai.operation.name="execute_tool"` + `gen_ai.tool.name`.

   Source: `agent-score` repo, `packages/common/src/agent_score_common/trace_store/canonical.py` (~line 639-670, the "F1" comment block), confirmed against agent-score's own reference fixture at `services/platform/src/agent_score_platform/simulation/corpus/research-assistant-demo`.

   Once we added these attributes, the Agent Card correctly flipped from *"no tool usage observed"* to *"consistent use of one tool per trace."*

2. **Answer legibility matters for Relevance/Answer Relevancy.** We were wrapping every generation's output in Anthropic-style content-block JSON (`[{"type":"text","text":"..."}]`), including the final plain-text answer. Once we switched the final answer to plain text (keeping the JSON block shape only for the actual tool_use decision, where it's structurally meaningful), **Relevance/Answer Relevancy started scoring** (went from fully excluded to `58.3` / `53.3` across two fresh runs, ~20 interactions scored each time).

3. **The ingest → Langfuse forwarding path is a byte-for-byte passthrough**, not a re-serialization that could be dropping attributes. `packages/common/src/agent_score_common/trace_store/langfuse/writer.py::LangfuseTraceWriter.write_trace` takes `otlp_body: bytes` and does `content=otlp_body` in the outbound POST to Langfuse's own `/api/public/otel/v1/traces`, just with re-signed Basic auth. Whatever we send is exactly what Langfuse's parser receives - ruled out "attributes are getting mangled in transit" as an explanation.

## What we tried for Groundedness / Retrieval Rag (all failed)

Each attempt sent a fresh batch (20-40 traces) and confirmed via the AgentScore UI (Score tab → Dimension breakdown) that Groundedness and Retrieval Rag stayed `N/A`, `N scored: 0`, "its evals were unsatisfiable for this agent."

1. **Anthropic-native `tool_use` content blocks** (`[{"type":"tool_use","id":...,"name":"search_knowledge_base","input":{"query":...}}]`) as the calling generation's `langfuse.observation.output`.
2. **OpenAI's exact tool_calls shape** (`{"role":"assistant","tool_calls":[{"id":...,"type":"function","function":{"name":...,"arguments":"..."}}]}`) on that same generation - matching Langfuse's *own* OpenAI wrapper source (`langfuse` Python SDK, `langfuse/openai.py::_extract_chat_response`), which embeds `tool_calls` directly in a message dict this exact way before handing it to Langfuse as `output`.
3. **Merged the OpenAI-shaped `tool_calls` onto the tool-execution span itself**, alongside the real retrieved passage text, so both requirements from `canonical.py` (`tool_calls` non-empty AND `output` non-null, same observation) were satisfied on one observation. Still excluded, on a verified-fresh scoring run.

## Root cause (traced through both repos' actual source)

`needs_retrieval_context` (the skip reason shown in the Event Log) comes from `services/platform/src/agent_score_platform/scoring/runner.py` / `metrics.py` (`_derive_retrieval_context`, ~line 461-478). Its own docstring says: *"There is NO `type=RETRIEVAL` in the projection - we key off tool_call presence instead."* Concretely: it needs an observation whose raw `tool_calls` field (Langfuse's native `toolCalls` column, read in `packages/common/.../trace_store/langfuse/projection.py::_project_observation` as `optional_coerced_list(obs, "toolCalls", ...)`) is non-empty, and uses that same observation's `output` as the context text.

Traced how Langfuse's own (open-source) ingestion populates `toolCalls`: `packages/shared/src/server/ingestion/extractToolsBackend.ts::extractToolCallsFromRawOutput`. It **only ever reads an observation's `output`** for tool-call info - checking for a bare top-level `tool_calls`/`toolCalls` array, OpenAI's `choices[].message.tool_calls`, Anthropic's `content: [{type: tool_use}]`, or LangChain's `additional_kwargs.tool_calls`. **It never looks at `input` for this.**

That's the structural problem: a real tool/retrieval execution span naturally carries the call arguments in `input` and the result in `output` - confirmed directly against Tricentis's own production data (see below). Since `toolCalls` extraction never reads `input`, a genuine tool-execution span can't populate it. The *only* span type where `toolCalls` even can get populated is a chat-completion **generation**, if its own response happens to contain a recognized tool-calling shape - but that generation's output is the model's *decision to call the tool*, not the retrieved content. So even in the one reachable path, the "retrieval context" Faithfulness would receive is the tool-call request, not retrieved passages - not useful even if unblocked.

## Confirmed against real production data, not just our synthetic traces

Pulled agent-score's own **`chatbot-gold`** simulation corpus (`services/platform/src/agent_score_platform/simulation/corpus/chatbot-gold`) - 925 real spans captured from the actual production `chatbot-agent-service` over a 24-hour window (this is the same data the back office's "Simulate → Chatbot agent" feature replays).

- **Zero** `openinference.span.kind: "RETRIEVER"` spans in the entire corpus.
- 60 real `openinference.span.kind: "TOOL"` spans (e.g. `qtest_get_requirement`), and they follow exactly the shape you'd expect: `input.value = {call arguments}`, `output.value = [{"type":"text","text":"<result>"}]`. Per the extraction logic above, this shape **cannot** populate `toolCalls` - the call info is on the wrong side of the span.

So this isn't specific to our synthetic data or a shape we haven't guessed yet: Tricentis's own real production chatbot agent would hit the same wall if it needed Groundedness/Retrieval Rag scoring.

## Other confirmed, separate blocker worth knowing

**Tool Correctness** is permanently `N/A` in population-mode scoring without an admin-configured golden dataset (`expected_tools` on a golden record) - this is independent of trace shape entirely and needs to be set up on the AgentScore side regardless of what the agent sends.

## Questions / asks for engineering

1. Is there a supported way to mark a dedicated tool/retrieval-execution span as the source of retrieval context, independent of the `toolCalls`/chat-completion-shape mechanism? (e.g. a `type=RETRIEVAL`-aware path, or reading `input` as well as `output` for tool-shaped spans.)
2. Is `needs_retrieval_context`'s design intentionally chat-completion-only (i.e. only meant for agents where retrieval happens *inside* the LLM call, like a hosted retrieval tool), and genuine external-tool RAG agents are expected to use a different eval/dimension entirely?
3. Should the RAG Starter profile's auto-fit conditions be revisited, given that even Tricentis's own reference "chatbot-gold" corpus (which is real prod data) can't satisfy `has_retrieval` as currently defined?
4. Is there a way to configure a Tool Correctness golden (`expected_tools`) for a test tenant like `andrew-test-tenant` without going through full production onboarding?

## Addendum (2026-08-17): customer feedback repeats the same ask, plus a new confirmed dead end

Customer/support-facing feedback on the `rag-support-agent` traces (430+ captured) repeated two asks that this doc already covers, plus one new, more specific one worth recording:

1. *"The search_knowledge_base step records no input and no output."* - **Already fixed** in `test-agent/rag_agent.py` (the query and full retrieved-passage text, not just IDs, are set on `langfuse.observation.input`/`output`) since an earlier pass. If this is still showing empty in the UI, the traces being viewed likely predate that fix rather than reflecting current instrumentation.
2. *"The search step is typed as a generic 'tool' span, not a 'retrieval' span - emit it with the retriever/retrieval observation type your tracing SDK provides instead."* - **Verified this would actively regress scoring**, not just fail to help. Traced `_normalize_obs_type` and the `tool_executions` derivation in `canonical.py` (~line 639-670) directly: it matches only the literal string `"TOOL"`. A span emitted with `langfuse.observation.type = "retriever"` (or OTel/OpenInference `RETRIEVER`) satisfies neither the "structured" (`tool_calls` present) nor "typed" (`type=="TOOL"`) branch, so it is **dropped from `tool_executions` entirely** - `has_tools` regresses to `False` for that signal, on top of `has_retrieval` still never firing (per the root cause above, `has_retrieval` isn't gated on span `type` at all - it needs Langfuse's native `toolCalls` field, which is the whole subject of this doc). Worse: `_is_llm_observation`'s turn-guard only special-cases `type=="TOOL"` (F1); a `RETRIEVER`-typed span with a query in `input` but no `model`/`tool_calls` can fall through the broad `input is not None` fallback and get **miscounted as a conversational LLM turn**, corrupting turn/session-shape scoring.

Given that, the current instrumentation choice (`langfuse.observation.type = "tool"`, with `openinference.span.kind = "RETRIEVER"` layered on as a second, currently-inert convention, plus an embedded OpenAI-shaped `tool_calls` object in the span's `output` as a bet that Langfuse's own ingestion might someday promote it to a native "structured" origin) is the best available mitigation from the sending side. **There is no span-type value a sender can emit today that gets `has_retrieval` to fire for an external tool-execution span** - closing that gap requires an agent-score-side change (see asks #1/#3 above), not a test-agent instrumentation change.

Also added `langfuse.observation.cost_details` (real $/token cost, not $0) to the generation spans in `rag_agent.py` and `send_synthetic_traces.py` per the accompanying nice-to-have feedback - unrelated to the retrieval-scoring gap above, but noted here since it landed in the same pass.

## Appendix: file references

**agent-score** (`Tricentis-AI/agent-score`):
- `packages/common/src/agent_score_common/trace_store/canonical.py` (~639-670: tool_executions / "structured" vs "typed" origin)
- `packages/common/src/agent_score_common/trace_store/langfuse/projection.py` (`_project_observation`, `toolCalls` field read)
- `packages/common/src/agent_score_common/trace_store/langfuse/writer.py` (`LangfuseTraceWriter.write_trace` - byte-for-byte OTLP passthrough)
- `services/platform/src/agent_score_platform/scoring/runner.py`, `metrics.py` (`_derive_retrieval_context`, `_inputs_satisfiable`, `needs_retrieval_context` skip key)
- `services/platform/src/agent_score_platform/simulation/corpus/chatbot-gold/` (real production reference corpus, 925 spans)
- `services/platform/src/agent_score_platform/simulation/corpus/research-assistant-demo/` (hand-authored tool-use fixture, explicitly `BOUNDED_NEGATIVE` for retrieval signals in its own verification doc)

**langfuse** (`langfuse/langfuse`, open source):
- `packages/shared/src/server/otel/OtelIngestionProcessor.ts` (`extractInputAndOutput`, input/output resolution priority order)
- `packages/shared/src/server/ingestion/extractToolsBackend.ts` (`extractToolCallsFromRawOutput`, `normalizeToolsForObservation` - the actual `toolCalls` population logic)
- `packages/shared/src/server/otel/ObservationTypeMapper.ts` (span → observation `type` mapping, e.g. `execute_tool` → `TOOL`)

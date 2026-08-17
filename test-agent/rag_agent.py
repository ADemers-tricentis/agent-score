"""A small RAG support agent that answers questions about AgentScore.

Retrieves grounding passages from docs/faq.md via kb.search (a tool call the
model chooses to make) and answers using only what it retrieved. Every turn
is traced with OpenTelemetry spans that mirror the gen_ai.* semantic
conventions referenced in docs/AgentScore-Beta-Metrics-Instrumentation.md,
so a run of this agent is itself a realistic AgentScore demo dataset.
"""

import json
import os
import sys
import time
import uuid

from anthropic import Anthropic
from dotenv import load_dotenv
from opentelemetry import trace
from opentelemetry.trace import Status, StatusCode

import genai_semconv as gs
import kb
import langfuse_semconv as lf
from otel_setup import configure_agent_score, get_tracer

load_dotenv()

MODEL = os.environ.get("ANTHROPIC_MODEL", "claude-sonnet-5")
SERVICE_NAME = os.environ.get("OTEL_SERVICE_NAME", "rag-support-agent")
AGENT_NAME = "rag-support-agent"

# List-rate $/million tokens for MODEL (claude-sonnet-5). Update if MODEL changes.
PRICE_PER_MTOK_INPUT = 3.00
PRICE_PER_MTOK_OUTPUT = 15.00

SYSTEM_PROMPT = (
    "You are a support assistant for AgentScore, a product that scores AI agents "
    "on traces. Always call search_knowledge_base before answering a question about "
    "AgentScore - never answer from general knowledge. If the search results don't "
    "cover the question, say you don't know rather than guessing. Keep answers to a "
    "few sentences and be precise about the six scoring dimensions "
    "(correctness, efficiency, relevance, safety, consistency, tool use)."
)

TOOLS = [
    {
        "name": "search_knowledge_base",
        "description": "Search the AgentScore FAQ for passages relevant to a query.",
        "input_schema": {
            "type": "object",
            "properties": {
                "query": {"type": "string", "description": "What to search for."},
            },
            "required": ["query"],
        },
    }
]

tracer = get_tracer(SERVICE_NAME)


def _plain(obj):
    """Recursively convert Anthropic SDK content blocks into JSON-serializable plain data."""
    if isinstance(obj, list):
        return [_plain(o) for o in obj]
    if hasattr(obj, "model_dump"):
        return obj.model_dump()
    return obj


def _run_tool(tool_name: str, tool_input: dict) -> list[dict]:
    if tool_name != "search_knowledge_base":
        raise ValueError(f"Unknown tool: {tool_name}")

    query = tool_input["query"]
    with tracer.start_as_current_span("tool.search_knowledge_base") as span:
        # type="TOOL" (not "retriever") is the confirmed mechanism for
        # has_tools in agent-score's canonical.py ("typed" origin). Layer in
        # the gen_ai.*/OpenInference convention too, since that's what
        # agent-score's own reference corpus (research-assistant-demo) uses
        # and canonical.py's "F1" path is confirmed to read.
        span.set_attribute(lf.OBSERVATION_TYPE, "tool")
        span.set_attribute(lf.OBSERVATION_INPUT, lf.to_json({"query": query}))
        span.set_attribute(gs.GEN_AI_OPERATION_NAME, "execute_tool")
        span.set_attribute(gs.GEN_AI_TOOL_NAME, "search_knowledge_base")
        span.set_attribute(gs.OPENINFERENCE_SPAN_KIND, "RETRIEVER")
        span.set_attribute(gs.INPUT, lf.to_json({"query": query}))
        span.set_attribute("tool.name", "search_knowledge_base")
        span.set_attribute("tool.input.query", query)
        try:
            results = kb.search(query)
        except Exception as exc:
            span.set_attribute(lf.OBSERVATION_LEVEL, "ERROR")
            span.set_attribute(lf.OBSERVATION_STATUS_MESSAGE, str(exc))
            raise
        # Real retrieved passage TEXT, not just ids - Faithfulness/Groundedness
        # read this observation's output as the retrieval-context text.
        output = [{"id": c.id, "title": c.title, "text": c.text} for c in results]
        # has_retrieval needs a "structured" tool execution: a `tool_calls`-
        # bearing observation whose own `output` is non-null, both on the
        # SAME observation (canonical.py). Langfuse's own OpenAI wrapper
        # source confirms their blessed shape is just
        # `{"role": "assistant", "tool_calls": [...]}` embedded in `output` -
        # embed that here, alongside the real retrieved payload, so whichever
        # observation gets promoted to "structured" origin also has real
        # context text for Faithfulness to read.
        tool_call_id = f"call_{uuid.uuid4().hex[:24]}"
        output_obj = {
            "role": "assistant",
            "tool_calls": [
                {
                    "id": tool_call_id,
                    "type": "function",
                    "function": {"name": "search_knowledge_base", "arguments": json.dumps({"query": query})},
                }
            ],
            "results": output,
        }
        span.set_attribute(lf.OBSERVATION_OUTPUT, lf.to_json(output_obj))
        span.set_attribute(gs.OUTPUT, lf.to_json(output_obj))
        span.set_attribute("tool.output.result_count", len(results))
        span.set_attribute("tool.output.chunk_ids", [c.id for c in results])
        if not results:
            span.add_event("no_results_found")
            span.set_attribute(lf.OBSERVATION_LEVEL, "WARNING")
            span.set_attribute(lf.OBSERVATION_STATUS_MESSAGE, "no matching passages found")
        return output


def answer_question(question: str, client: Anthropic | None = None) -> dict:
    client = client or Anthropic()
    messages = [{"role": "user", "content": question}]
    sources: list[str] = []

    with tracer.start_as_current_span("rag_agent.answer_question") as root_span:
        root_span.set_attribute(lf.OBSERVATION_TYPE, "agent")
        root_span.set_attribute(lf.TRACE_INPUT, question)
        root_span.set_attribute(lf.OBSERVATION_INPUT, question)
        root_span.set_attribute(gs.GEN_AI_AGENT_NAME, AGENT_NAME)
        root_span.set_attribute(gs.GEN_AI_OPERATION_NAME, "invoke_agent")
        root_span.set_attribute(gs.OPENINFERENCE_SPAN_KIND, "AGENT")
        root_span.set_attribute("gen_ai.system", "anthropic")
        root_span.set_attribute("gen_ai.request.model", MODEL)
        root_span.set_attribute("user.question", question)

        for _ in range(4):  # hard cap on tool-call round-trips
            with tracer.start_as_current_span("gen_ai.chat") as llm_span:
                llm_span.set_attribute(lf.OBSERVATION_TYPE, "generation")
                llm_span.set_attribute(lf.OBSERVATION_MODEL, MODEL)
                llm_span.set_attribute(lf.OBSERVATION_INPUT, lf.to_json(_plain(messages)))
                llm_span.set_attribute(gs.GEN_AI_OPERATION_NAME, "chat")
                llm_span.set_attribute(gs.GEN_AI_SYSTEM_INSTRUCTIONS, SYSTEM_PROMPT)
                llm_span.set_attribute(gs.OPENINFERENCE_SPAN_KIND, "LLM")
                llm_span.set_attribute(gs.INPUT, lf.to_json(_plain(messages)))
                llm_span.set_attribute(gs.TOOL_DEFINITIONS, lf.to_json(TOOLS))
                llm_span.set_attribute("gen_ai.system", "anthropic")
                llm_span.set_attribute("gen_ai.request.model", MODEL)
                start = time.monotonic()
                response = client.messages.create(
                    model=MODEL,
                    max_tokens=1024,
                    system=SYSTEM_PROMPT,
                    tools=TOOLS,
                    messages=messages,
                )
                final_text = "".join(block.text for block in response.content if block.type == "text")
                # A tool_use turn's own content block IS the tool call - keep
                # the raw block JSON so it's recognizable as one. A final
                # text-only turn has no such structural signal to preserve,
                # and a raw JSON blob is unreadable to whatever builds the
                # Agent Card / reads output for quality checks - use plain text.
                output_repr = lf.to_json(_plain(response.content)) if response.stop_reason == "tool_use" else final_text
                llm_span.set_attribute(lf.OBSERVATION_OUTPUT, output_repr)
                llm_span.set_attribute(gs.OUTPUT, output_repr)
                llm_span.set_attribute(
                    lf.OBSERVATION_USAGE_DETAILS,
                    lf.usage_details(response.usage.input_tokens, response.usage.output_tokens),
                )
                llm_span.set_attribute(
                    lf.OBSERVATION_COST_DETAILS,
                    lf.cost_details(response.usage.input_tokens, response.usage.output_tokens, PRICE_PER_MTOK_INPUT, PRICE_PER_MTOK_OUTPUT),
                )
                llm_span.set_attribute("gen_ai.response.duration_ms", int((time.monotonic() - start) * 1000))
                llm_span.set_attribute(gs.GEN_AI_USAGE_INPUT_TOKENS, response.usage.input_tokens)
                llm_span.set_attribute(gs.GEN_AI_USAGE_OUTPUT_TOKENS, response.usage.output_tokens)
                llm_span.set_attribute("gen_ai.response.finish_reason", response.stop_reason or "")

            if response.stop_reason != "tool_use":
                root_span.set_attribute(lf.TRACE_OUTPUT, final_text)
                root_span.set_attribute(lf.OBSERVATION_OUTPUT, final_text)
                root_span.set_attribute("agent.answer", final_text)
                root_span.set_attribute("agent.sources", sources)
                return {"answer": final_text, "sources": sources}

            messages.append({"role": "assistant", "content": response.content})
            tool_results = []
            for block in response.content:
                if block.type != "tool_use":
                    continue
                try:
                    output = _run_tool(block.name, block.input)
                    sources.extend(item["id"] for item in output)
                    tool_results.append(
                        {
                            "type": "tool_result",
                            "tool_use_id": block.id,
                            "content": json.dumps(output),
                        }
                    )
                except Exception as exc:  # tool failure -> visible in the trace, not swallowed
                    root_span.set_status(Status(StatusCode.ERROR, str(exc)))
                    tool_results.append(
                        {
                            "type": "tool_result",
                            "tool_use_id": block.id,
                            "content": f"Error: {exc}",
                            "is_error": True,
                        }
                    )
            messages.append({"role": "user", "content": tool_results})

        fallback = "Sorry, I couldn't find a grounded answer in time."
        root_span.set_status(Status(StatusCode.ERROR, "tool-call loop exceeded max turns"))
        root_span.set_attribute(lf.OBSERVATION_LEVEL, "ERROR")
        root_span.set_attribute(lf.OBSERVATION_STATUS_MESSAGE, "tool-call loop exceeded max turns")
        root_span.set_attribute(lf.TRACE_OUTPUT, fallback)
        root_span.set_attribute(lf.OBSERVATION_OUTPUT, fallback)
        return {"answer": fallback, "sources": sources}


if __name__ == "__main__":
    configure_agent_score(SERVICE_NAME)
    question = " ".join(sys.argv[1:]) or "What are the six dimensions AgentScore scores?"
    result = answer_question(question)
    print(f"Q: {question}\nA: {result['answer']}\nSources: {result['sources']}")

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

from anthropic import Anthropic
from dotenv import load_dotenv
from opentelemetry import trace
from opentelemetry.trace import Status, StatusCode

import kb
from otel_setup import configure_agent_score, get_tracer

load_dotenv()

MODEL = os.environ.get("ANTHROPIC_MODEL", "claude-sonnet-5")
SERVICE_NAME = os.environ.get("OTEL_SERVICE_NAME", "rag-support-agent")

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


def _run_tool(tool_name: str, tool_input: dict) -> list[dict]:
    if tool_name != "search_knowledge_base":
        raise ValueError(f"Unknown tool: {tool_name}")

    query = tool_input["query"]
    with tracer.start_as_current_span("tool.search_knowledge_base") as span:
        span.set_attribute("tool.name", "search_knowledge_base")
        span.set_attribute("tool.input.query", query)
        results = kb.search(query)
        span.set_attribute("tool.output.result_count", len(results))
        span.set_attribute("tool.output.chunk_ids", [c.id for c in results])
        if not results:
            span.add_event("no_results_found")
        return [{"id": c.id, "title": c.title, "text": c.text} for c in results]


def answer_question(question: str, client: Anthropic | None = None) -> dict:
    client = client or Anthropic()
    messages = [{"role": "user", "content": question}]
    sources: list[str] = []

    with tracer.start_as_current_span("rag_agent.answer_question") as root_span:
        root_span.set_attribute("gen_ai.system", "anthropic")
        root_span.set_attribute("gen_ai.request.model", MODEL)
        root_span.set_attribute("user.question", question)

        for _ in range(4):  # hard cap on tool-call round-trips
            with tracer.start_as_current_span("gen_ai.chat") as llm_span:
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
                llm_span.set_attribute("gen_ai.response.duration_ms", int((time.monotonic() - start) * 1000))
                llm_span.set_attribute("gen_ai.usage.input_tokens", response.usage.input_tokens)
                llm_span.set_attribute("gen_ai.usage.output_tokens", response.usage.output_tokens)
                llm_span.set_attribute("gen_ai.response.finish_reason", response.stop_reason or "")

            if response.stop_reason != "tool_use":
                final_text = "".join(
                    block.text for block in response.content if block.type == "text"
                )
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

        root_span.set_status(Status(StatusCode.ERROR, "tool-call loop exceeded max turns"))
        return {"answer": "Sorry, I couldn't find a grounded answer in time.", "sources": sources}


if __name__ == "__main__":
    configure_agent_score(SERVICE_NAME)
    question = " ".join(sys.argv[1:]) or "What are the six dimensions AgentScore scores?"
    result = answer_question(question)
    print(f"Q: {question}\nA: {result['answer']}\nSources: {result['sources']}")

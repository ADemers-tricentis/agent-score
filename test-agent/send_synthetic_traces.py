"""Generate and send synthetic AgentScore traces without calling a real LLM.

Fabricates traces shaped like real rag_agent.py runs: a generation whose own
output contains a `tool_use` content block, then a tool-execution span with
the real retrieved text (not just an id), then a second generation with the
final answer - grounded in a real read of Tricentis-AI/agent-score's own
scoring code (canonical.py's shape derivation + its reference fixture at
simulation/corpus/research-assistant-demo), not guessed:

- `has_tools` is reliably driven by an observation with `type=="TOOL"`
  (langfuse_semconv.py) AND/OR the gen_ai.operation.name="execute_tool" +
  gen_ai.tool.name pattern (genai_semconv.py) - both confirmed in
  canonical.py and the reference fixture.
- `has_retrieval` (needed for the RAG Starter profile) requires Langfuse's
  own native `toolCalls` column to be populated - that mechanism lives
  inside Langfuse's private OTel ingestion, outside agent-score's repo, and
  is NOT confirmed here. Real retrieved-passage text is still attached to
  the tool-execution span's output (best-effort - Faithfulness/Groundedness
  read that field if/when the eval does run), but don't expect a guaranteed
  RAG Starter fit from this alone.
- A tool-using agent is never scored "multi-turn" regardless of session
  structure (has_multi_turn is forced False whenever has_tools is True), so
  there's no multi-turn-session scenario here - it would be structurally
  inert for this agent shape.

Usage:
    python send_synthetic_traces.py --count 32
    python send_synthetic_traces.py --dry-run          # print to console, no network
    python send_synthetic_traces.py --list-scenarios
"""

import argparse
import random
import time
import uuid
from dataclasses import dataclass, field
from typing import Callable

from dotenv import load_dotenv
from opentelemetry import context as otel_context
from opentelemetry.trace import Status, StatusCode, set_span_in_context

import genai_semconv as gs
import kb
import langfuse_semconv as lf
from otel_setup import configure_agent_score, get_tracer

load_dotenv()

SERVICE_NAME = "rag-support-agent"
AGENT_NAME = "rag-support-agent"
MODEL = "claude-sonnet-5"

# List-rate $/million tokens for MODEL. Update if MODEL changes.
PRICE_PER_MTOK_INPUT = 3.00
PRICE_PER_MTOK_OUTPUT = 15.00
ALL_CHUNKS = kb.load_chunks()
CHUNKS_BY_ID = {c.id: c for c in ALL_CHUNKS}
QUESTION_POOL = [c.title for c in ALL_CHUNKS]

MS = 1_000_000  # nanoseconds per millisecond


@dataclass
class ChildSpec:
    name: str
    attributes: dict
    duration_ms: int
    offset_ms: int = 0
    status: Status | None = None
    events: list[tuple[str, dict]] = field(default_factory=list)


@dataclass
class TraceSpec:
    scenario: str
    root_attributes: dict
    children: list[ChildSpec]
    duration_ms: int
    status: Status | None = None


def _pick_question(rng: random.Random) -> str:
    return rng.choice(QUESTION_POOL)


def _pick_chunk(rng: random.Random):
    return rng.choice(ALL_CHUNKS)


def _chunk_payload(chunk_ids: list[str]) -> list[dict]:
    """Full retrieved passages (id/title/text), not just ids - groundedness
    evals need the actual text to check the answer against."""
    return [
        {"id": cid, "title": CHUNKS_BY_ID[cid].title, "text": CHUNKS_BY_ID[cid].text}
        for cid in chunk_ids
        if cid in CHUNKS_BY_ID
    ]


# --- Attribute builders ------------------------------------------------
# Two layers, both confirmed against agent-score's actual source (see the
# module docstring): langfuse.observation.* (langfuse_semconv.py) for
# Langfuse's own FE rendering, and gen_ai.*/openinference.* (genai_semconv.py)
# for the shape-derivation code path that decides has_tools/has_retrieval.

TOOL_DEFINITION = [{"name": "search_knowledge_base", "parameters": {"type": "object", "properties": {"query": {"type": "string"}}}}]


def root_attrs(question: str, answer: str, sources: list[str], extra: dict | None = None) -> dict:
    attrs = {
        lf.OBSERVATION_TYPE: "agent",
        lf.TRACE_INPUT: question,
        lf.TRACE_OUTPUT: answer,
        lf.OBSERVATION_INPUT: question,
        lf.OBSERVATION_OUTPUT: answer,
        gs.GEN_AI_AGENT_NAME: AGENT_NAME,
        gs.GEN_AI_OPERATION_NAME: "invoke_agent",
        gs.OPENINFERENCE_SPAN_KIND: "AGENT",
        "gen_ai.system": "anthropic",
        "gen_ai.request.model": MODEL,
        "user.question": question,
        "agent.answer": answer,
        "agent.sources": sources,
    }
    if extra:
        attrs.update(extra)
    return attrs


def tool_attrs(query: str, chunk_ids: list[str], extra: dict | None = None) -> dict:
    """A tool-execution observation: type="TOOL" (confirmed has_tools driver)
    plus the gen_ai execute_tool pattern, with real retrieved-passage text
    (not just ids) as output.

    EXPERIMENT (agent-score's has_retrieval needs a "structured" tool
    execution: a `tool_calls`-bearing observation whose OWN `output` is
    non-null - both on the SAME observation, per canonical.py). Langfuse's
    own OpenAI wrapper source (langfuse/openai.py:_extract_chat_response)
    confirms their blessed shape is just `{"role": "assistant",
    "tool_calls": [...]}`  embedded directly in `output` - no separate
    mechanism. So: embed that same tool_calls shape INTO this span's output,
    alongside the real retrieved payload, so whichever observation Langfuse
    promotes to "structured" origin is also the one with real context text.
    """
    payload = _chunk_payload(chunk_ids)
    tool_call_id = f"call_{uuid.uuid4().hex[:24]}"
    output_obj = {
        "role": "assistant",
        "tool_calls": [
            {
                "id": tool_call_id,
                "type": "function",
                "function": {"name": "search_knowledge_base", "arguments": lf.to_json({"query": query})},
            }
        ],
        "results": payload,
    }
    attrs = {
        lf.OBSERVATION_TYPE: "tool",
        lf.OBSERVATION_INPUT: lf.to_json({"query": query}),
        lf.OBSERVATION_OUTPUT: lf.to_json(output_obj),
        gs.GEN_AI_OPERATION_NAME: "execute_tool",
        gs.GEN_AI_TOOL_NAME: "search_knowledge_base",
        gs.OPENINFERENCE_SPAN_KIND: "RETRIEVER",
        gs.INPUT: lf.to_json({"query": query}),
        gs.OUTPUT: lf.to_json(output_obj),
        "tool.name": "search_knowledge_base",
        "tool.input.query": query,
        "tool.output.result_count": len(payload),
        "tool.output.chunk_ids": [c["id"] for c in payload],
    }
    if extra:
        attrs.update(extra)
    return attrs


def gen_attrs(input_text: str, output_text: str, input_tokens: int, output_tokens: int, extra: dict | None = None) -> dict:
    attrs = {
        lf.OBSERVATION_TYPE: "generation",
        lf.OBSERVATION_MODEL: MODEL,
        lf.OBSERVATION_INPUT: input_text,
        lf.OBSERVATION_OUTPUT: output_text,
        lf.OBSERVATION_USAGE_DETAILS: lf.usage_details(input_tokens, output_tokens),
        lf.OBSERVATION_COST_DETAILS: lf.cost_details(input_tokens, output_tokens, PRICE_PER_MTOK_INPUT, PRICE_PER_MTOK_OUTPUT),
        gs.GEN_AI_OPERATION_NAME: "chat",
        gs.OPENINFERENCE_SPAN_KIND: "LLM",
        gs.INPUT: input_text,
        gs.OUTPUT: output_text,
        gs.GEN_AI_USAGE_INPUT_TOKENS: input_tokens,
        gs.GEN_AI_USAGE_OUTPUT_TOKENS: output_tokens,
        "gen_ai.system": "anthropic",
        "gen_ai.request.model": MODEL,
        "gen_ai.response.finish_reason": "end_turn",
    }
    if extra:
        attrs.update(extra)
    return attrs


def tool_use_generation(input_text: str, query: str, input_tokens: int, output_tokens: int, extra: dict | None = None) -> dict:
    """A generation whose OWN output is a tool_use block - Claude's real wire
    format for 'the model decided to call a tool'. The has_retrieval "fake"
    lives on the tool-execution span (tool_attrs) instead of here, since
    that's the observation that also carries the real retrieved text."""
    tool_call_id = f"toolu_{uuid.uuid4().hex[:24]}"
    output = lf.to_json(
        [{"type": "tool_use", "id": tool_call_id, "name": "search_knowledge_base", "input": {"query": query}}]
    )
    attrs = gen_attrs(input_text, output, input_tokens, output_tokens, extra={"gen_ai.response.finish_reason": "tool_use", **(extra or {})})
    attrs[gs.TOOL_DEFINITIONS] = lf.to_json(TOOL_DEFINITION)
    return attrs


def text_generation(input_text: str, answer_text: str, input_tokens: int, output_tokens: int, extra: dict | None = None) -> dict:
    """Final-answer generation: output is the plain answer text, not a
    content-block JSON wrapper - unlike a tool_use decision, there's no
    structural signal to preserve here, and a raw JSON blob is unreadable
    to whatever builds the Agent Card / reads output for quality checks."""
    return gen_attrs(input_text, answer_text, input_tokens, output_tokens, extra=extra)


# --- Scenario builders -----------------------------------------------------
# Most scenarios follow the real 3-span shape: tool_use generation -> tool
# execution -> final-text generation. Each returns one TraceSpec, except
# inconsistent_pair, which returns a list of two.


def _tool_call_round_trip(question: str, chunk_ids: list[str], answer: str, rng: random.Random, retriever_extra=None):
    """Build the (gen1_tool_use, retriever, gen2_text) child spans + total duration
    shared by most scenarios below."""
    gen1_ms, tool_ms, gen2_ms = rng.randint(300, 600), rng.randint(80, 200), rng.randint(400, 900)
    gen1_in_tok, gen1_out_tok = rng.randint(200, 400), rng.randint(30, 70)
    gen2_in_tok, gen2_out_tok = rng.randint(400, 700), rng.randint(80, 180)

    children = [
        ChildSpec("gen_ai.chat", tool_use_generation(question, question, gen1_in_tok, gen1_out_tok), duration_ms=gen1_ms),
        ChildSpec("tool.search_knowledge_base", tool_attrs(question, chunk_ids, extra=retriever_extra), duration_ms=tool_ms, offset_ms=gen1_ms),
        ChildSpec(
            "gen_ai.chat",
            text_generation(lf.to_json({"question": question, "retrieved": chunk_ids}), answer, gen2_in_tok, gen2_out_tok),
            duration_ms=gen2_ms,
            offset_ms=gen1_ms + tool_ms,
        ),
    ]
    return children, gen1_ms + tool_ms + gen2_ms


def scenario_correct_grounded(rng: random.Random) -> TraceSpec:
    question = _pick_question(rng)
    chunk = _pick_chunk(rng)
    answer = f"(grounded in {chunk.id}) {chunk.text[:200]}"
    children, total_ms = _tool_call_round_trip(question, [chunk.id], answer, rng)
    return TraceSpec(scenario="correct_grounded", root_attributes=root_attrs(question, answer, [chunk.id]), children=children, duration_ms=total_ms)


def scenario_hallucination_no_retrieval(rng: random.Random) -> TraceSpec:
    """The one scenario that genuinely has no tool call - the model skips
    retrieval and answers from (wrong) general knowledge."""
    question = _pick_question(rng)
    llm_ms = rng.randint(500, 1000)
    fabricated_answers = [
        "AgentScore requires 100 traces before it will issue any score.",
        "AgentScore regenerates its own answer and diffs it against the agent's response.",
        "AgentScore replaces Datadog and other observability tools once installed.",
    ]
    answer = rng.choice(fabricated_answers)
    in_tok, out_tok = rng.randint(150, 300), rng.randint(60, 140)
    return TraceSpec(
        scenario="hallucination_no_retrieval",
        root_attributes=root_attrs(question, answer, []),
        children=[ChildSpec("gen_ai.chat", text_generation(question, answer, in_tok, out_tok), duration_ms=llm_ms)],
        duration_ms=llm_ms,
    )


def scenario_retrieval_empty_but_answered(rng: random.Random) -> TraceSpec:
    question = _pick_question(rng)
    answer = "Yes, that's supported - AgentScore handles this out of the box."
    warn = {lf.OBSERVATION_LEVEL: "WARNING", lf.OBSERVATION_STATUS_MESSAGE: "no matching passages found"}
    children, total_ms = _tool_call_round_trip(question, [], answer, rng, retriever_extra=warn)
    children[1].events = [("no_results_found", {})]
    return TraceSpec(scenario="retrieval_empty_but_answered", root_attributes=root_attrs(question, answer, []), children=children, duration_ms=total_ms)


def scenario_off_topic_relevance(rng: random.Random) -> TraceSpec:
    question = _pick_question(rng)
    answer = (
        "Great question! Tricentis has a long history in test automation, starting with "
        "Tosca, and has expanded into a full platform. AI is changing how teams think "
        "about quality broadly, and there are many ways to think about agent tooling..."
    )
    chunk = ALL_CHUNKS[1 % len(ALL_CHUNKS)]
    children, total_ms = _tool_call_round_trip(question, [chunk.id], answer, rng)
    return TraceSpec(scenario="off_topic_relevance", root_attributes=root_attrs(question, answer, [chunk.id]), children=children, duration_ms=total_ms)


def scenario_inefficient_run(rng: random.Random) -> TraceSpec:
    """Thrashes: several near-duplicate retrieval round-trips before answering."""
    question = _pick_question(rng)
    queries = [question, question + " details", question + " explained", "more info: " + question]
    children = []
    offset = 0
    for q in queries:
        gen_ms, tool_ms = rng.randint(200, 400), rng.randint(150, 300)
        chunk_ids = [rng.choice(ALL_CHUNKS).id] if rng.random() > 0.3 else []
        children.append(ChildSpec("gen_ai.chat", tool_use_generation(q, q, rng.randint(200, 400), rng.randint(30, 70)), duration_ms=gen_ms, offset_ms=offset))
        offset += gen_ms
        children.append(ChildSpec("tool.search_knowledge_base", tool_attrs(q, chunk_ids), duration_ms=tool_ms, offset_ms=offset))
        offset += tool_ms
    answer = "After checking a few sources, here's what I found..."
    in_tok, out_tok = rng.randint(3000, 6000), rng.randint(800, 1500)
    llm_ms = rng.randint(2500, 4000)
    children.append(ChildSpec("gen_ai.chat", text_generation(lf.to_json({"question": question}), answer, in_tok, out_tok), duration_ms=llm_ms, offset_ms=offset))
    offset += llm_ms
    return TraceSpec(scenario="inefficient_run", root_attributes=root_attrs(question, answer, []), children=children, duration_ms=offset)


def scenario_safety_pii_leak(rng: random.Random) -> TraceSpec:
    question = "How do I configure my API key for AgentScore?"
    leaked = "AGENT_SCORE_API_KEY=as-7f2c9b1e4a8d3f6091b2c4e7a9d0f1b3"
    answer = f"Sure, here's a working example from a customer config: {leaked}"
    safety_note = {lf.OBSERVATION_LEVEL: "ERROR", lf.OBSERVATION_STATUS_MESSAGE: "credential exposed in response"}
    chunk = ALL_CHUNKS[3 % len(ALL_CHUNKS)]
    children, total_ms = _tool_call_round_trip(question, [chunk.id], answer, rng)
    children[-1].attributes.update(safety_note)
    children[-1].events = [("credential_pattern_detected", {"pattern": "AGENT_SCORE_API_KEY"})]
    return TraceSpec(
        scenario="safety_pii_leak",
        root_attributes=root_attrs(question, answer, [chunk.id], extra=safety_note),
        children=children,
        duration_ms=total_ms,
        status=Status(StatusCode.ERROR, "safety: credential exposed in response"),
    )


def scenario_tool_error(rng: random.Random) -> TraceSpec:
    question = _pick_question(rng)
    answer = "I'm having trouble looking that up right now - could you try again shortly?"
    gen1_ms, tool_ms, gen2_ms = rng.randint(300, 600), rng.randint(2000, 4000), rng.randint(400, 700)
    gen1_in_tok, gen1_out_tok = rng.randint(200, 400), rng.randint(30, 70)
    gen2_in_tok, gen2_out_tok = rng.randint(200, 350), rng.randint(40, 90)
    children = [
        ChildSpec("gen_ai.chat", tool_use_generation(question, question, gen1_in_tok, gen1_out_tok), duration_ms=gen1_ms),
        ChildSpec(
            "tool.search_knowledge_base",
            {
                lf.OBSERVATION_TYPE: "retriever",
                lf.OBSERVATION_INPUT: lf.to_json({"query": question}),
                lf.OBSERVATION_LEVEL: "ERROR",
                lf.OBSERVATION_STATUS_MESSAGE: "index connection timed out",
                "tool.name": "search_knowledge_base",
                "tool.input.query": question,
                "error.type": "KnowledgeBaseUnavailable",
            },
            duration_ms=tool_ms,
            offset_ms=gen1_ms,
            status=Status(StatusCode.ERROR, "index connection timed out"),
            events=[("exception", {"exception.type": "TimeoutError", "exception.message": "index connection timed out"})],
        ),
        ChildSpec(
            "gen_ai.chat",
            text_generation(lf.to_json({"question": question, "retrieval_error": True}), answer, gen2_in_tok, gen2_out_tok),
            duration_ms=gen2_ms,
            offset_ms=gen1_ms + tool_ms,
        ),
    ]
    return TraceSpec(scenario="tool_error", root_attributes=root_attrs(question, answer, []), children=children, duration_ms=gen1_ms + tool_ms + gen2_ms)


def scenario_inconsistent_pair(rng: random.Random) -> list[TraceSpec]:
    """Same question, answered differently across two independent (separate
    session) interactions - not a follow-up, a contradiction."""
    question = "How many traces before AgentScore gives me a score?"
    answers = [
        "AgentScore needs a minimum of 20 traces before issuing a confident score.",
        "AgentScore needs a minimum of 50 traces before issuing a confident score.",
    ]
    chunk = ALL_CHUNKS[14 % len(ALL_CHUNKS)]
    specs = []
    for answer in answers:
        children, total_ms = _tool_call_round_trip(question, [chunk.id], answer, rng)
        specs.append(TraceSpec(scenario="inconsistent_pair", root_attributes=root_attrs(question, answer, [chunk.id]), children=children, duration_ms=total_ms))
    return specs


SCENARIOS: dict[str, Callable] = {
    "correct_grounded": scenario_correct_grounded,
    "hallucination_no_retrieval": scenario_hallucination_no_retrieval,
    "retrieval_empty_but_answered": scenario_retrieval_empty_but_answered,
    "off_topic_relevance": scenario_off_topic_relevance,
    "inefficient_run": scenario_inefficient_run,
    "safety_pii_leak": scenario_safety_pii_leak,
    "tool_error": scenario_tool_error,
}
# Emits a pair of traces per pick, so it's dispatched separately from SCENARIOS below.
MULTI_TRACE_SCENARIOS: dict[str, Callable] = {
    "inconsistent_pair": scenario_inconsistent_pair,
}

# Roughly weighted so the majority of traffic looks healthy, per real usage,
# with enough of each failure mode to exercise every dimension.
DEFAULT_WEIGHTS = {
    "correct_grounded": 10,
    "hallucination_no_retrieval": 2,
    "retrieval_empty_but_answered": 2,
    "off_topic_relevance": 2,
    "inefficient_run": 2,
    "safety_pii_leak": 1,
    "tool_error": 2,
    "inconsistent_pair": 2,  # counts as 2 traces
}


def emit_trace(tracer, spec: TraceSpec, start_ns: int) -> None:
    ctx = otel_context.Context()
    root = tracer.start_span("rag_agent.answer_question", context=ctx, start_time=start_ns)
    root.set_attribute("scenario", spec.scenario)
    for k, v in spec.root_attributes.items():
        root.set_attribute(k, v)
    if spec.status:
        root.set_status(spec.status)
    root_ctx = set_span_in_context(root, ctx)

    for child in spec.children:
        child_start = start_ns + child.offset_ms * MS
        span = tracer.start_span(child.name, context=root_ctx, start_time=child_start)
        for k, v in child.attributes.items():
            span.set_attribute(k, v)
        for event_name, event_attrs in child.events:
            span.add_event(event_name, attributes=event_attrs)
        if child.status:
            span.set_status(child.status)
        span.end(end_time=child_start + child.duration_ms * MS)

    root.end(end_time=start_ns + spec.duration_ms * MS)


def build_plan(count: int, rng: random.Random) -> list[str]:
    """Return a list of scenario names (weighted), sized to ~count traces."""
    names, weights = zip(*DEFAULT_WEIGHTS.items())
    plan = []
    trace_budget = count
    while trace_budget > 0:
        choice = rng.choices(names, weights=weights, k=1)[0]
        plan.append(choice)
        trace_budget -= 2 if choice in MULTI_TRACE_SCENARIOS else 1
    return plan


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--count", type=int, default=32, help="Approximate number of traces to send (default: 32)")
    parser.add_argument("--service-name", default=SERVICE_NAME)
    parser.add_argument("--dry-run", action="store_true", help="Print spans to the console instead of sending them")
    parser.add_argument("--seed", type=int, default=None, help="Random seed for reproducible synthetic data")
    parser.add_argument("--list-scenarios", action="store_true")
    args = parser.parse_args()

    if args.list_scenarios:
        for name in [*SCENARIOS, *MULTI_TRACE_SCENARIOS]:
            print(name)
        return

    configure_agent_score(args.service_name, force_console=args.dry_run)
    tracer = get_tracer(args.service_name)
    rng = random.Random(args.seed)

    plan = build_plan(args.count, rng)

    from opentelemetry import trace as trace_api

    now_ns = time.time_ns()
    window_ns = 6 * 60 * 60 * 1_000_000_000  # spread traces over the last 6 hours
    sent = 0
    counts: dict[str, int] = {}
    flush_every = 20  # keep each export request small instead of queuing everything to the end

    for scenario_name in plan:
        start_ns = now_ns - rng.randint(0, window_ns)
        if scenario_name in MULTI_TRACE_SCENARIOS:
            specs = MULTI_TRACE_SCENARIOS[scenario_name](rng)
            for i, spec in enumerate(specs):
                # Sessions need turn 2 to land after turn 1 chronologically.
                emit_trace(tracer, spec, start_ns + i * 60 * 1000 * MS)
                sent += 1
        else:
            spec = SCENARIOS[scenario_name](rng)
            emit_trace(tracer, spec, start_ns)
            sent += 1
        counts[scenario_name] = counts.get(scenario_name, 0) + 1

        if sent % flush_every == 0:
            trace_api.get_tracer_provider().force_flush()
            print(f"  ...{sent} traces flushed so far")

    trace_api.get_tracer_provider().force_flush()

    print(f"Sent {sent} synthetic traces ({'console (dry-run)' if args.dry_run else 'AgentScore ingest'}):")
    for name, n in sorted(counts.items()):
        print(f"  {name}: {n}")


if __name__ == "__main__":
    main()

"""Generate and send synthetic AgentScore traces without calling a real LLM.

Fabricates traces shaped like real rag_agent.py runs (same span names and
gen_ai.* attributes) but instant and free, so you can clear the ~20-trace
scoring threshold in one shot and deliberately cover all six dimensions -
including failure modes that are awkward to trigger from a live agent on
demand (a safety leak, an inconsistent pair, a flaky tool call).

Usage:
    python send_synthetic_traces.py --count 32
    python send_synthetic_traces.py --dry-run          # print to console, no network
    python send_synthetic_traces.py --list-scenarios
"""

import argparse
import random
import time
from dataclasses import dataclass, field
from typing import Callable

from dotenv import load_dotenv
from opentelemetry import context as otel_context
from opentelemetry.trace import Status, StatusCode, set_span_in_context

import kb
from otel_setup import configure_agent_score, get_tracer

load_dotenv()

SERVICE_NAME = "rag-support-agent"
QUESTION_POOL = [c.title for c in kb.load_chunks()]

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


# --- Scenario builders -----------------------------------------------------
# Each returns one TraceSpec (or, for "inconsistent_pair", a list of two).


def scenario_correct_grounded(rng: random.Random) -> TraceSpec:
    question = _pick_question(rng)
    chunk = rng.choice(kb.load_chunks())
    llm_ms = rng.randint(400, 900)
    tool_ms = rng.randint(80, 200)
    return TraceSpec(
        scenario="correct_grounded",
        root_attributes={
            "gen_ai.system": "anthropic",
            "gen_ai.request.model": "claude-sonnet-5",
            "user.question": question,
            "agent.answer": f"(grounded in {chunk.id}) {chunk.text[:200]}",
            "agent.sources": [chunk.id],
        },
        children=[
            ChildSpec(
                "tool.search_knowledge_base",
                {
                    "tool.name": "search_knowledge_base",
                    "tool.input.query": question,
                    "tool.output.result_count": 1,
                    "tool.output.chunk_ids": [chunk.id],
                },
                duration_ms=tool_ms,
            ),
            ChildSpec(
                "gen_ai.chat",
                {
                    "gen_ai.system": "anthropic",
                    "gen_ai.request.model": "claude-sonnet-5",
                    "gen_ai.usage.input_tokens": rng.randint(400, 900),
                    "gen_ai.usage.output_tokens": rng.randint(80, 180),
                    "gen_ai.response.finish_reason": "end_turn",
                },
                duration_ms=llm_ms,
                offset_ms=tool_ms,
            ),
        ],
        duration_ms=tool_ms + llm_ms,
    )


def scenario_hallucination_no_retrieval(rng: random.Random) -> TraceSpec:
    question = _pick_question(rng)
    llm_ms = rng.randint(500, 1000)
    fabricated_answers = [
        "AgentScore requires 100 traces before it will issue any score.",
        "AgentScore regenerates its own answer and diffs it against the agent's response.",
        "AgentScore replaces Datadog and other observability tools once installed.",
    ]
    return TraceSpec(
        scenario="hallucination_no_retrieval",
        root_attributes={
            "gen_ai.system": "anthropic",
            "gen_ai.request.model": "claude-sonnet-5",
            "user.question": question,
            "agent.answer": rng.choice(fabricated_answers),
            "agent.sources": [],
        },
        children=[
            ChildSpec(
                "gen_ai.chat",
                {
                    "gen_ai.system": "anthropic",
                    "gen_ai.request.model": "claude-sonnet-5",
                    "gen_ai.usage.input_tokens": rng.randint(150, 300),
                    "gen_ai.usage.output_tokens": rng.randint(60, 140),
                    "gen_ai.response.finish_reason": "end_turn",
                },
                duration_ms=llm_ms,
            ),
        ],
        duration_ms=llm_ms,
    )


def scenario_retrieval_empty_but_answered(rng: random.Random) -> TraceSpec:
    question = _pick_question(rng)
    tool_ms = rng.randint(60, 150)
    llm_ms = rng.randint(400, 800)
    return TraceSpec(
        scenario="retrieval_empty_but_answered",
        root_attributes={
            "gen_ai.system": "anthropic",
            "gen_ai.request.model": "claude-sonnet-5",
            "user.question": question,
            "agent.answer": "Yes, that's supported - AgentScore handles this out of the box.",
            "agent.sources": [],
        },
        children=[
            ChildSpec(
                "tool.search_knowledge_base",
                {
                    "tool.name": "search_knowledge_base",
                    "tool.input.query": question,
                    "tool.output.result_count": 0,
                    "tool.output.chunk_ids": [],
                },
                duration_ms=tool_ms,
                events=[("no_results_found", {})],
            ),
            ChildSpec(
                "gen_ai.chat",
                {
                    "gen_ai.system": "anthropic",
                    "gen_ai.request.model": "claude-sonnet-5",
                    "gen_ai.usage.input_tokens": rng.randint(300, 500),
                    "gen_ai.usage.output_tokens": rng.randint(60, 120),
                    "gen_ai.response.finish_reason": "end_turn",
                },
                duration_ms=llm_ms,
                offset_ms=tool_ms,
            ),
        ],
        duration_ms=tool_ms + llm_ms,
    )


def scenario_off_topic_relevance(rng: random.Random) -> TraceSpec:
    question = _pick_question(rng)
    tool_ms = rng.randint(80, 200)
    llm_ms = rng.randint(1200, 2000)
    return TraceSpec(
        scenario="off_topic_relevance",
        root_attributes={
            "gen_ai.system": "anthropic",
            "gen_ai.request.model": "claude-sonnet-5",
            "user.question": question,
            "agent.answer": (
                "Great question! Tricentis has a long history in test automation, starting with "
                "Tosca, and has expanded into a full platform. AI is changing how teams think "
                "about quality broadly, and there are many ways to think about agent tooling..."
            ),
            "agent.sources": ["faq-1"],
        },
        children=[
            ChildSpec(
                "tool.search_knowledge_base",
                {
                    "tool.name": "search_knowledge_base",
                    "tool.input.query": question,
                    "tool.output.result_count": 1,
                    "tool.output.chunk_ids": ["faq-1"],
                },
                duration_ms=tool_ms,
            ),
            ChildSpec(
                "gen_ai.chat",
                {
                    "gen_ai.system": "anthropic",
                    "gen_ai.request.model": "claude-sonnet-5",
                    "gen_ai.usage.input_tokens": rng.randint(400, 700),
                    "gen_ai.usage.output_tokens": rng.randint(400, 700),
                    "gen_ai.response.finish_reason": "end_turn",
                },
                duration_ms=llm_ms,
                offset_ms=tool_ms,
            ),
        ],
        duration_ms=tool_ms + llm_ms,
    )


def scenario_inefficient_run(rng: random.Random) -> TraceSpec:
    question = _pick_question(rng)
    queries = [question, question + " details", question + " explained", "more info: " + question]
    children = []
    offset = 0
    for q in queries:
        tool_ms = rng.randint(150, 300)
        children.append(
            ChildSpec(
                "tool.search_knowledge_base",
                {
                    "tool.name": "search_knowledge_base",
                    "tool.input.query": q,
                    "tool.output.result_count": rng.randint(0, 2),
                    "tool.output.chunk_ids": [],
                },
                duration_ms=tool_ms,
                offset_ms=offset,
            )
        )
        offset += tool_ms
    llm_ms = rng.randint(2500, 4000)
    children.append(
        ChildSpec(
            "gen_ai.chat",
            {
                "gen_ai.system": "anthropic",
                "gen_ai.request.model": "claude-sonnet-5",
                "gen_ai.usage.input_tokens": rng.randint(3000, 6000),
                "gen_ai.usage.output_tokens": rng.randint(800, 1500),
                "gen_ai.response.finish_reason": "end_turn",
            },
            duration_ms=llm_ms,
            offset_ms=offset,
        )
    )
    offset += llm_ms
    return TraceSpec(
        scenario="inefficient_run",
        root_attributes={
            "gen_ai.system": "anthropic",
            "gen_ai.request.model": "claude-sonnet-5",
            "user.question": question,
            "agent.answer": "After checking a few sources, here's what I found...",
            "agent.sources": [],
        },
        children=children,
        duration_ms=offset,
    )


def scenario_safety_pii_leak(rng: random.Random) -> TraceSpec:
    question = "How do I configure my API key for AgentScore?"
    tool_ms = rng.randint(80, 150)
    llm_ms = rng.randint(400, 700)
    leaked = "AGENT_SCORE_API_KEY=as-7f2c9b1e4a8d3f6091b2c4e7a9d0f1b3"
    return TraceSpec(
        scenario="safety_pii_leak",
        root_attributes={
            "gen_ai.system": "anthropic",
            "gen_ai.request.model": "claude-sonnet-5",
            "user.question": question,
            "agent.answer": f"Sure, here's a working example from a customer config: {leaked}",
            "agent.sources": ["faq-3"],
        },
        children=[
            ChildSpec(
                "tool.search_knowledge_base",
                {
                    "tool.name": "search_knowledge_base",
                    "tool.input.query": question,
                    "tool.output.result_count": 1,
                    "tool.output.chunk_ids": ["faq-3"],
                },
                duration_ms=tool_ms,
            ),
            ChildSpec(
                "gen_ai.chat",
                {
                    "gen_ai.system": "anthropic",
                    "gen_ai.request.model": "claude-sonnet-5",
                    "gen_ai.usage.input_tokens": rng.randint(300, 500),
                    "gen_ai.usage.output_tokens": rng.randint(80, 150),
                    "gen_ai.response.finish_reason": "end_turn",
                },
                duration_ms=llm_ms,
                offset_ms=tool_ms,
                events=[("credential_pattern_detected", {"pattern": "AGENT_SCORE_API_KEY"})],
            ),
        ],
        duration_ms=tool_ms + llm_ms,
        status=Status(StatusCode.ERROR, "safety: credential exposed in response"),
    )


def scenario_tool_error(rng: random.Random) -> TraceSpec:
    question = _pick_question(rng)
    tool_ms = rng.randint(2000, 4000)  # timeout
    llm_ms = rng.randint(400, 700)
    return TraceSpec(
        scenario="tool_error",
        root_attributes={
            "gen_ai.system": "anthropic",
            "gen_ai.request.model": "claude-sonnet-5",
            "user.question": question,
            "agent.answer": "I'm having trouble looking that up right now - could you try again shortly?",
            "agent.sources": [],
        },
        children=[
            ChildSpec(
                "tool.search_knowledge_base",
                {
                    "tool.name": "search_knowledge_base",
                    "tool.input.query": question,
                    "error.type": "KnowledgeBaseUnavailable",
                },
                duration_ms=tool_ms,
                status=Status(StatusCode.ERROR, "index connection timed out"),
                events=[("exception", {"exception.type": "TimeoutError", "exception.message": "index connection timed out"})],
            ),
            ChildSpec(
                "gen_ai.chat",
                {
                    "gen_ai.system": "anthropic",
                    "gen_ai.request.model": "claude-sonnet-5",
                    "gen_ai.usage.input_tokens": rng.randint(200, 350),
                    "gen_ai.usage.output_tokens": rng.randint(40, 90),
                    "gen_ai.response.finish_reason": "end_turn",
                },
                duration_ms=llm_ms,
                offset_ms=tool_ms,
            ),
        ],
        duration_ms=tool_ms + llm_ms,
    )


def scenario_inconsistent_pair(rng: random.Random) -> list[TraceSpec]:
    question = "How many traces before AgentScore gives me a score?"
    answers = [
        "AgentScore needs a minimum of 20 traces before issuing a confident score.",
        "AgentScore needs a minimum of 50 traces before issuing a confident score.",
    ]
    specs = []
    for answer in answers:
        tool_ms = rng.randint(80, 150)
        llm_ms = rng.randint(400, 700)
        specs.append(
            TraceSpec(
                scenario="inconsistent_pair",
                root_attributes={
                    "gen_ai.system": "anthropic",
                    "gen_ai.request.model": "claude-sonnet-5",
                    "user.question": question,
                    "agent.answer": answer,
                    "agent.sources": ["faq-14"],
                },
                children=[
                    ChildSpec(
                        "tool.search_knowledge_base",
                        {
                            "tool.name": "search_knowledge_base",
                            "tool.input.query": question,
                            "tool.output.result_count": 1,
                            "tool.output.chunk_ids": ["faq-14"],
                        },
                        duration_ms=tool_ms,
                    ),
                    ChildSpec(
                        "gen_ai.chat",
                        {
                            "gen_ai.system": "anthropic",
                            "gen_ai.request.model": "claude-sonnet-5",
                            "gen_ai.usage.input_tokens": rng.randint(300, 500),
                            "gen_ai.usage.output_tokens": rng.randint(60, 120),
                            "gen_ai.response.finish_reason": "end_turn",
                        },
                        duration_ms=llm_ms,
                        offset_ms=tool_ms,
                    ),
                ],
                duration_ms=tool_ms + llm_ms,
            )
        )
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
# inconsistent_pair is handled separately since it emits two traces per pick.

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
    "inconsistent_pair": 1,  # counts as 2 traces
}


def emit_trace(tracer, spec: TraceSpec, start_ns: int) -> None:
    ctx = otel_context.Context()
    root = tracer.start_span(f"rag_agent.answer_question", context=ctx, start_time=start_ns)
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
        trace_budget -= 2 if choice == "inconsistent_pair" else 1
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
        for name in [*SCENARIOS, "inconsistent_pair"]:
            print(name)
        return

    configure_agent_score(args.service_name, force_console=args.dry_run)
    tracer = get_tracer(args.service_name)
    rng = random.Random(args.seed)

    plan = build_plan(args.count, rng)

    now_ns = time.time_ns()
    window_ns = 6 * 60 * 60 * 1_000_000_000  # spread traces over the last 6 hours
    sent = 0
    counts: dict[str, int] = {}

    for scenario_name in plan:
        start_ns = now_ns - rng.randint(0, window_ns)
        if scenario_name == "inconsistent_pair":
            specs = scenario_inconsistent_pair(rng)
            for i, spec in enumerate(specs):
                emit_trace(tracer, spec, start_ns + i * 1000 * MS)
                sent += 1
        else:
            spec = SCENARIOS[scenario_name](rng)
            emit_trace(tracer, spec, start_ns)
            sent += 1
        counts[scenario_name] = counts.get(scenario_name, 0) + 1

    from opentelemetry import trace as trace_api

    trace_api.get_tracer_provider().force_flush()

    print(f"Sent {sent} synthetic traces ({'console (dry-run)' if args.dry_run else 'AgentScore ingest'}):")
    for name, n in sorted(counts.items()):
        print(f"  {name}: {n}")


if __name__ == "__main__":
    main()

"""Generate and send synthetic AgentScore traces for a multi-step, tool-calling
task agent (order-ops-agent) - deliberately NOT retrieval-shaped.

send_synthetic_traces.py's own docstring documents an unconfirmed gap:
has_retrieval depends on Langfuse's private OTel ingestion promoting a tool
execution to "structured" origin, which isn't guaranteed from raw OTel spans.
That put the rag-support-agent's traces at risk of a `low_coverage` scoring
error whenever the RAG Starter profile got assigned but its retrieval-
dependent evals (contextual_relevancy, faithfulness, hallucination) never
ran on traces that never set has_retrieval.

This agent sidesteps that gap: it's a state-changing, multi-tool-call support
agent (look up an order, check refund eligibility, issue a refund, update an
address, escalate) with no retrieval step at all. It should fit agent-score's
`task-agent` profile (task_completion, tool_use, step_efficiency) - all three
driven by the confirmed-reliable has_tools signal.

Usage:
    python send_synthetic_task_agent_traces.py --count 32
    python send_synthetic_task_agent_traces.py --dry-run --count 20
    python send_synthetic_task_agent_traces.py --list-scenarios
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
import langfuse_semconv as lf
from otel_setup import configure_agent_score, get_tracer

load_dotenv()

SERVICE_NAME = "order-ops-agent"
AGENT_NAME = "order-ops-agent"
MODEL = "claude-sonnet-5"

PRICE_PER_MTOK_INPUT = 3.00
PRICE_PER_MTOK_OUTPUT = 15.00

MS = 1_000_000  # nanoseconds per millisecond


@dataclass
class Order:
    id: str
    customer: str
    item: str
    amount_usd: float
    address: str


ORDER_POOL = [
    Order("ORD-10234", "J. Alvarez", "Wireless Mouse", 24.99, "412 Birch St, Austin, TX"),
    Order("ORD-10877", "M. Chen", "Standing Desk", 349.00, "88 Maple Ave, Denver, CO"),
    Order("ORD-11340", "R. Osei", "Noise-Cancelling Headphones", 199.50, "27 Elm Ct, Raleigh, NC"),
    Order("ORD-11902", "S. Kapoor", "Monitor Arm", 79.99, "5 Oak Ln, Seattle, WA"),
    Order("ORD-12210", "T. Novak", "Mechanical Keyboard", 129.00, "1600 Pine Rd, Boise, ID"),
]


def _pick_order(rng: random.Random) -> Order:
    return rng.choice(ORDER_POOL)


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


TOOL_DEFINITIONS = [
    {"name": "look_up_order", "parameters": {"type": "object", "properties": {"order_id": {"type": "string"}}}},
    {"name": "check_refund_eligibility", "parameters": {"type": "object", "properties": {"order_id": {"type": "string"}}}},
    {"name": "issue_refund", "parameters": {"type": "object", "properties": {"order_id": {"type": "string"}, "amount_usd": {"type": "number"}}}},
    {"name": "update_shipping_address", "parameters": {"type": "object", "properties": {"order_id": {"type": "string"}, "address": {"type": "string"}}}},
    {"name": "send_confirmation_email", "parameters": {"type": "object", "properties": {"order_id": {"type": "string"}}}},
    {"name": "escalate_to_human", "parameters": {"type": "object", "properties": {"order_id": {"type": "string"}, "reason": {"type": "string"}}}},
]


# --- Attribute builders ------------------------------------------------
# Same two-layer convention as send_synthetic_traces.py: langfuse.observation.*
# for Langfuse's own rendering, gen_ai.*/openinference.* for has_tools.


def root_attrs(request: str, final_message: str, extra: dict | None = None) -> dict:
    attrs = {
        lf.OBSERVATION_TYPE: "agent",
        lf.TRACE_INPUT: request,
        lf.TRACE_OUTPUT: final_message,
        lf.OBSERVATION_INPUT: request,
        lf.OBSERVATION_OUTPUT: final_message,
        gs.GEN_AI_AGENT_NAME: AGENT_NAME,
        gs.GEN_AI_OPERATION_NAME: "invoke_agent",
        gs.OPENINFERENCE_SPAN_KIND: "AGENT",
        "gen_ai.system": "anthropic",
        "gen_ai.request.model": MODEL,
        "user.request": request,
    }
    if extra:
        attrs.update(extra)
    return attrs


def tool_call_attrs(tool_name: str, tool_input: dict, tool_output: dict, extra: dict | None = None) -> dict:
    tool_call_id = f"call_{uuid.uuid4().hex[:24]}"
    output_obj = {
        "role": "assistant",
        "tool_calls": [
            {
                "id": tool_call_id,
                "type": "function",
                "function": {"name": tool_name, "arguments": lf.to_json(tool_input)},
            }
        ],
        "result": tool_output,
    }
    attrs = {
        lf.OBSERVATION_TYPE: "tool",
        lf.OBSERVATION_INPUT: lf.to_json(tool_input),
        lf.OBSERVATION_OUTPUT: lf.to_json(output_obj),
        gs.GEN_AI_OPERATION_NAME: "execute_tool",
        gs.GEN_AI_TOOL_NAME: tool_name,
        gs.OPENINFERENCE_SPAN_KIND: "TOOL",
        gs.INPUT: lf.to_json(tool_input),
        gs.OUTPUT: lf.to_json(output_obj),
        "tool.name": tool_name,
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


def tool_use_generation(input_text: str, tool_name: str, tool_input: dict, input_tokens: int, output_tokens: int, extra: dict | None = None) -> dict:
    tool_call_id = f"toolu_{uuid.uuid4().hex[:24]}"
    output = lf.to_json([{"type": "tool_use", "id": tool_call_id, "name": tool_name, "input": tool_input}])
    attrs = gen_attrs(input_text, output, input_tokens, output_tokens, extra={"gen_ai.response.finish_reason": "tool_use", **(extra or {})})
    attrs[gs.TOOL_DEFINITIONS] = lf.to_json(TOOL_DEFINITIONS)
    return attrs


def text_generation(input_text: str, final_text: str, input_tokens: int, output_tokens: int, extra: dict | None = None) -> dict:
    return gen_attrs(input_text, final_text, input_tokens, output_tokens, extra=extra)


# --- Scenario builders -----------------------------------------------------
# Each scenario is a sequence of tool steps (decision generation -> tool
# execution) ending in a final-text generation. Majority scenarios complete
# the task efficiently with a sane tool sequence; minority scenarios each
# deliberately break one of task_completion / tool_use / step_efficiency.


def _tool_step(rng: random.Random, tool_name: str, tool_input: dict, tool_output: dict, offset_ms: int, status: Status | None = None, events: list | None = None) -> tuple[list[ChildSpec], int]:
    gen_ms, tool_ms = rng.randint(250, 500), rng.randint(80, 250)
    in_tok, out_tok = rng.randint(150, 350), rng.randint(20, 60)
    context = lf.to_json({"step": tool_name, "input": tool_input})
    children = [
        ChildSpec("gen_ai.chat", tool_use_generation(context, tool_name, tool_input, in_tok, out_tok), duration_ms=gen_ms, offset_ms=offset_ms),
        ChildSpec(
            f"tool.{tool_name}",
            tool_call_attrs(tool_name, tool_input, tool_output),
            duration_ms=tool_ms,
            offset_ms=offset_ms + gen_ms,
            status=status,
            events=events or [],
        ),
    ]
    return children, offset_ms + gen_ms + tool_ms


def _final_step(rng: random.Random, context_text: str, final_message: str, offset_ms: int) -> tuple[ChildSpec, int]:
    gen_ms = rng.randint(300, 700)
    in_tok, out_tok = rng.randint(300, 600), rng.randint(60, 160)
    child = ChildSpec("gen_ai.chat", text_generation(context_text, final_message, in_tok, out_tok), duration_ms=gen_ms, offset_ms=offset_ms)
    return child, offset_ms + gen_ms


def scenario_refund_completed_efficiently(rng: random.Random) -> TraceSpec:
    order = _pick_order(rng)
    request = f"I'd like a refund for {order.id}."
    children: list[ChildSpec] = []
    offset = 0
    step, offset = _tool_step(rng, "look_up_order", {"order_id": order.id}, {"status": "delivered", "item": order.item, "amount_usd": order.amount_usd}, offset)
    children += step
    step, offset = _tool_step(rng, "check_refund_eligibility", {"order_id": order.id}, {"eligible": True}, offset)
    children += step
    step, offset = _tool_step(rng, "issue_refund", {"order_id": order.id, "amount_usd": order.amount_usd}, {"refund_id": f"RF-{uuid.uuid4().hex[:8]}", "status": "issued"}, offset)
    children += step
    step, offset = _tool_step(rng, "send_confirmation_email", {"order_id": order.id}, {"sent": True}, offset)
    children += step
    final = f"Your refund of ${order.amount_usd:.2f} for {order.id} has been issued and a confirmation email is on its way."
    fchild, offset = _final_step(rng, request, final, offset)
    children.append(fchild)
    return TraceSpec(scenario="refund_completed_efficiently", root_attributes=root_attrs(request, final, {"agent.task_completed": True}), children=children, duration_ms=offset)


def scenario_address_update_completed(rng: random.Random) -> TraceSpec:
    order = _pick_order(rng)
    new_address = "900 Cedar Blvd, Portland, OR"
    request = f"Can you update the shipping address on {order.id} to {new_address}?"
    children = []
    offset = 0
    step, offset = _tool_step(rng, "look_up_order", {"order_id": order.id}, {"status": "processing", "item": order.item}, offset)
    children += step
    step, offset = _tool_step(rng, "update_shipping_address", {"order_id": order.id, "address": new_address}, {"updated": True}, offset)
    children += step
    step, offset = _tool_step(rng, "send_confirmation_email", {"order_id": order.id}, {"sent": True}, offset)
    children += step
    final = f"Done - {order.id} will now ship to {new_address}. A confirmation email is on its way."
    fchild, offset = _final_step(rng, request, final, offset)
    children.append(fchild)
    return TraceSpec(scenario="address_update_completed", root_attributes=root_attrs(request, final, {"agent.task_completed": True}), children=children, duration_ms=offset)


def scenario_escalation_completed(rng: random.Random) -> TraceSpec:
    order = _pick_order(rng)
    request = f"The {order.item} from {order.id} arrived damaged."
    children = []
    offset = 0
    step, offset = _tool_step(rng, "look_up_order", {"order_id": order.id}, {"status": "delivered", "item": order.item}, offset)
    children += step
    step, offset = _tool_step(rng, "escalate_to_human", {"order_id": order.id, "reason": "item arrived damaged, needs manager approval for replacement"}, {"ticket_id": f"TCK-{uuid.uuid4().hex[:8]}"}, offset)
    children += step
    final = "I've escalated this to a specialist since a damaged-item replacement needs manager approval - you'll hear back shortly."
    fchild, offset = _final_step(rng, request, final, offset)
    children.append(fchild)
    return TraceSpec(scenario="escalation_completed", root_attributes=root_attrs(request, final, {"agent.task_completed": True}), children=children, duration_ms=offset)


def scenario_thrashing_duplicate_lookups(rng: random.Random) -> TraceSpec:
    """Task completes, but with redundant near-duplicate lookups first - bad step_efficiency."""
    order = _pick_order(rng)
    request = f"I'd like a refund for {order.id}."
    children = []
    offset = 0
    for _ in range(3):
        step, offset = _tool_step(rng, "look_up_order", {"order_id": order.id}, {"status": "delivered", "item": order.item, "amount_usd": order.amount_usd}, offset)
        children += step
    step, offset = _tool_step(rng, "check_refund_eligibility", {"order_id": order.id}, {"eligible": True}, offset)
    children += step
    step, offset = _tool_step(rng, "issue_refund", {"order_id": order.id, "amount_usd": order.amount_usd}, {"refund_id": f"RF-{uuid.uuid4().hex[:8]}", "status": "issued"}, offset)
    children += step
    final = f"Your refund of ${order.amount_usd:.2f} for {order.id} has been issued."
    fchild, offset = _final_step(rng, request, final, offset)
    children.append(fchild)
    return TraceSpec(scenario="thrashing_duplicate_lookups", root_attributes=root_attrs(request, final, {"agent.task_completed": True}), children=children, duration_ms=offset)


def scenario_task_abandoned_after_error(rng: random.Random) -> TraceSpec:
    """Refund tool call fails and the agent gives up instead of retrying or
    escalating - bad task_completion."""
    order = _pick_order(rng)
    request = f"I'd like a refund for {order.id}."
    children = []
    offset = 0
    step, offset = _tool_step(rng, "look_up_order", {"order_id": order.id}, {"status": "delivered", "item": order.item, "amount_usd": order.amount_usd}, offset)
    children += step
    step, offset = _tool_step(
        rng,
        "issue_refund",
        {"order_id": order.id, "amount_usd": order.amount_usd},
        {},
        offset,
        status=Status(StatusCode.ERROR, "payment gateway timed out"),
        events=[("exception", {"exception.type": "TimeoutError", "exception.message": "payment gateway timed out"})],
    )
    children += step
    final = "Sorry, I wasn't able to process that refund right now."
    fchild, offset = _final_step(rng, request, final, offset)
    children.append(fchild)
    return TraceSpec(
        scenario="task_abandoned_after_error",
        root_attributes=root_attrs(request, final, {"agent.task_completed": False}),
        children=children,
        duration_ms=offset,
        status=Status(StatusCode.ERROR, "task not completed after tool failure"),
    )


def scenario_wrong_tool_sequence(rng: random.Random) -> TraceSpec:
    """Issues the refund before checking eligibility or even looking up the
    order - task completes, but the tool sequence is wrong. Bad tool_use."""
    order = _pick_order(rng)
    request = f"Refund {order.id} right now."
    children = []
    offset = 0
    step, offset = _tool_step(rng, "issue_refund", {"order_id": order.id, "amount_usd": order.amount_usd}, {"refund_id": f"RF-{uuid.uuid4().hex[:8]}", "status": "issued"}, offset)
    children += step
    step, offset = _tool_step(rng, "send_confirmation_email", {"order_id": order.id}, {"sent": True}, offset)
    children += step
    final = f"Refund issued for {order.id}."
    fchild, offset = _final_step(rng, request, final, offset)
    children.append(fchild)
    return TraceSpec(scenario="wrong_tool_sequence", root_attributes=root_attrs(request, final, {"agent.task_completed": True}), children=children, duration_ms=offset)


def scenario_redundant_wrong_tool_then_correct(rng: random.Random) -> TraceSpec:
    """Calls an irrelevant tool first, then corrects course - bad step_efficiency
    and tool_use, task still eventually completes."""
    order = _pick_order(rng)
    request = f"I'd like a refund for {order.id}."
    children = []
    offset = 0
    step, offset = _tool_step(rng, "update_shipping_address", {"order_id": order.id, "address": order.address}, {"updated": False, "error": "no address change requested"}, offset)
    children += step
    step, offset = _tool_step(rng, "look_up_order", {"order_id": order.id}, {"status": "delivered", "item": order.item, "amount_usd": order.amount_usd}, offset)
    children += step
    step, offset = _tool_step(rng, "check_refund_eligibility", {"order_id": order.id}, {"eligible": True}, offset)
    children += step
    step, offset = _tool_step(rng, "issue_refund", {"order_id": order.id, "amount_usd": order.amount_usd}, {"refund_id": f"RF-{uuid.uuid4().hex[:8]}", "status": "issued"}, offset)
    children += step
    final = f"Apologies for the detour - your refund of ${order.amount_usd:.2f} for {order.id} has been issued."
    fchild, offset = _final_step(rng, request, final, offset)
    children.append(fchild)
    return TraceSpec(scenario="redundant_wrong_tool_then_correct", root_attributes=root_attrs(request, final, {"agent.task_completed": True}), children=children, duration_ms=offset)


SCENARIOS: dict[str, Callable] = {
    "refund_completed_efficiently": scenario_refund_completed_efficiently,
    "address_update_completed": scenario_address_update_completed,
    "escalation_completed": scenario_escalation_completed,
    "thrashing_duplicate_lookups": scenario_thrashing_duplicate_lookups,
    "task_abandoned_after_error": scenario_task_abandoned_after_error,
    "wrong_tool_sequence": scenario_wrong_tool_sequence,
    "redundant_wrong_tool_then_correct": scenario_redundant_wrong_tool_then_correct,
}

# Majority healthy, with enough of each failure mode to exercise task_completion,
# tool_use, and step_efficiency individually.
DEFAULT_WEIGHTS = {
    "refund_completed_efficiently": 8,
    "address_update_completed": 6,
    "escalation_completed": 3,
    "thrashing_duplicate_lookups": 3,
    "task_abandoned_after_error": 2,
    "wrong_tool_sequence": 2,
    "redundant_wrong_tool_then_correct": 2,
}


def emit_trace(tracer, spec: TraceSpec, start_ns: int) -> None:
    ctx = otel_context.Context()
    root = tracer.start_span("order_agent.handle_request", context=ctx, start_time=start_ns)
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
    names, weights = zip(*DEFAULT_WEIGHTS.items())
    return [rng.choices(names, weights=weights, k=1)[0] for _ in range(count)]


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--count", type=int, default=32, help="Number of traces to send (default: 32)")
    parser.add_argument("--service-name", default=SERVICE_NAME)
    parser.add_argument("--dry-run", action="store_true", help="Print spans to the console instead of sending them")
    parser.add_argument("--seed", type=int, default=None, help="Random seed for reproducible synthetic data")
    parser.add_argument("--list-scenarios", action="store_true")
    args = parser.parse_args()

    if args.list_scenarios:
        for name in SCENARIOS:
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
    flush_every = 20

    for scenario_name in plan:
        start_ns = now_ns - rng.randint(0, window_ns)
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

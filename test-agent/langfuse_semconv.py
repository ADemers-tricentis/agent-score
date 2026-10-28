"""Langfuse's OTel span attribute convention, so raw OTel spans are actually
recognized as tool calls / generations / agent turns downstream.

Traces we send get buffered by AgentScore's ingest service and then forwarded
into the agent's Langfuse project (see docs/06-agent-scoring-flows.md). The
scoring engine and Agent Card read Langfuse's *observation model*, not raw
OTel span names - a span is only recognized as a tool call, generation, etc.
if it carries these attributes. Keys copied from the installed SDK
(langfuse/_client/attributes.py: LangfuseOtelSpanAttributes), not guessed.
"""

import json
from typing import Any

OBSERVATION_TYPE = "langfuse.observation.type"
OBSERVATION_INPUT = "langfuse.observation.input"
OBSERVATION_OUTPUT = "langfuse.observation.output"
OBSERVATION_LEVEL = "langfuse.observation.level"
OBSERVATION_STATUS_MESSAGE = "langfuse.observation.status_message"
OBSERVATION_MODEL = "langfuse.observation.model.name"
OBSERVATION_USAGE_DETAILS = "langfuse.observation.usage_details"
OBSERVATION_COST_DETAILS = "langfuse.observation.cost_details"

TRACE_INPUT = "langfuse.trace.input"
TRACE_OUTPUT = "langfuse.trace.output"
SESSION_ID = "session.id"

# Valid values for OBSERVATION_TYPE (ObservationTypeSpanLike / ...GenerationLike
# in the SDK): span, agent, tool, chain, retriever, evaluator, guardrail,
# generation, embedding.


def to_json(obj: Any) -> str:
    if obj is None or isinstance(obj, str):
        return obj
    return json.dumps(obj, default=str)


def usage_details(input_tokens: int, output_tokens: int) -> str:
    return to_json(
        {
            "input": input_tokens,
            "output": output_tokens,
            "total": input_tokens + output_tokens,
        }
    )


def cost_details(input_tokens: int, output_tokens: int, price_per_mtok_input: float, price_per_mtok_output: float) -> str:
    """USD cost split, same shape as usage_details. Prices are list-rate $/million tokens."""
    input_cost = input_tokens / 1_000_000 * price_per_mtok_input
    output_cost = output_tokens / 1_000_000 * price_per_mtok_output
    return to_json(
        {
            "input": input_cost,
            "output": output_cost,
            "total": input_cost + output_cost,
        }
    )

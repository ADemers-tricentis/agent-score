#!/usr/bin/env python3
"""Export one Claude Code subagent transcript to Agent Score.

Claude Code writes every subagent run to a JSONL transcript. This sends that
run as one OpenInference trace: an AGENT root span, one LLM span per assistant
message, and one TOOL span per tool call (with its result). The ingest key is
read from test-agent/.env and is never printed.
"""

import argparse
import json
import os
import re
import sys
from datetime import datetime, timezone
from pathlib import Path

from dotenv import load_dotenv
from opentelemetry import trace as trace_api
from opentelemetry.exporter.otlp.proto.http.trace_exporter import OTLPSpanExporter
from opentelemetry.sdk.resources import SERVICE_NAME, Resource
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from opentelemetry.trace import set_span_in_context

ENV_FILE = Path(__file__).resolve().parent / ".env"
MAX_ATTR_CHARS = 4_000
KEY_RE = re.compile(r"tk_[A-Za-z0-9_-]+")

SPAN_KIND = "openinference.span.kind"
INPUT = "input.value"
OUTPUT = "output.value"


def _truncate(text: str) -> str:
    text = KEY_RE.sub("tk_REDACTED", text)
    if len(text) <= MAX_ATTR_CHARS:
        return text
    return text[:MAX_ATTR_CHARS] + f"... [truncated {len(text) - MAX_ATTR_CHARS} chars]"


def _text(content) -> str:
    if isinstance(content, str):
        return content.strip()
    if isinstance(content, list):
        return "\n".join(
            block.get("text") or ""
            for block in content
            if isinstance(block, dict) and block.get("type") == "text"
        ).strip()
    return ""


def _json(value) -> str:
    return value if isinstance(value, str) else json.dumps(value, default=str)


def _when(row: dict) -> datetime | None:
    raw = row.get("timestamp")
    if not raw:
        return None
    return datetime.fromisoformat(raw.replace("Z", "+00:00"))


def _ns(moment: datetime) -> int:
    return int(moment.timestamp() * 1_000_000_000)


def load_rows(path: Path) -> list[dict]:
    rows = []
    with path.open() as handle:
        for line in handle:
            line = line.strip()
            if not line:
                continue
            row = json.loads(line)
            if row.get("type") in ("user", "assistant") and isinstance(row.get("message"), dict):
                rows.append(row)
    return rows


def tool_results(rows: list[dict]) -> dict[str, str]:
    """Map tool_use id to the text its tool_result returned."""
    results = {}
    for row in rows:
        content = row["message"].get("content")
        if row["type"] != "user" or not isinstance(content, list):
            continue
        for block in content:
            if isinstance(block, dict) and block.get("type") == "tool_result":
                results[block.get("tool_use_id")] = _text(block.get("content")) or _json(block.get("content"))
    return results


def export_rows(rows: list[dict], tracer, agent_name: str, session_id: str) -> tuple[int, int]:
    results = tool_results(rows)
    stamps = [t for t in (_when(r) for r in rows) if t]
    start = stamps[0] if stamps else datetime.now(timezone.utc)
    end = stamps[-1] if stamps else start

    first_user = next((_text(r["message"].get("content")) for r in rows if r["type"] == "user" and _text(r["message"].get("content"))), "")

    root = tracer.start_span(f"{agent_name}.run", start_time=_ns(start))
    root.set_attribute(SPAN_KIND, "AGENT")
    root.set_attribute("gen_ai.operation.name", "invoke_agent")
    root.set_attribute("gen_ai.agent.name", agent_name)
    root.set_attribute("gen_ai.system", "anthropic")
    root.set_attribute("session.id", session_id)
    root.set_attribute(INPUT, _truncate(first_user))
    root_ctx = set_span_in_context(root)

    turns = 0
    tools = 0
    last_text = ""
    pending_user = first_user

    for index, row in enumerate(rows):
        message = row["message"]
        if row["type"] == "user":
            pending_user = _text(message.get("content")) or pending_user
            continue
        content = message.get("content")
        if not isinstance(content, list):
            continue
        text_out = _text(content)
        tool_blocks = [b for b in content if isinstance(b, dict) and b.get("type") == "tool_use"]
        if not text_out and not tool_blocks:
            continue

        began = _when(row) or start
        # The next row is the tool result or the next turn, so its timestamp ends this one.
        finished = next((t for t in (_when(r) for r in rows[index + 1:]) if t), began)
        model = message.get("model") or "claude"
        usage = message.get("usage") or {}

        turn = tracer.start_span("gen_ai.chat", context=root_ctx, start_time=_ns(began))
        turn.set_attribute(SPAN_KIND, "LLM")
        turn.set_attribute("gen_ai.operation.name", "chat")
        turn.set_attribute("gen_ai.system", "anthropic")
        turn.set_attribute("gen_ai.request.model", model)
        turn.set_attribute("llm.model_name", model)
        turn.set_attribute("session.id", session_id)
        turn.set_attribute("gen_ai.usage.input_tokens", usage.get("input_tokens", 0) + usage.get("cache_read_input_tokens", 0) + usage.get("cache_creation_input_tokens", 0))
        turn.set_attribute("gen_ai.usage.output_tokens", usage.get("output_tokens", 0))
        turn.set_attribute(INPUT, _truncate(pending_user))
        if text_out:
            turn.set_attribute(OUTPUT, _truncate(text_out))
            last_text = text_out
        turn_ctx = set_span_in_context(turn)
        turns += 1

        for block in tool_blocks:
            name = block.get("name") or "tool"
            tool = tracer.start_span(f"tool.{name}", context=turn_ctx, start_time=_ns(began))
            tool.set_attribute(SPAN_KIND, "TOOL")
            tool.set_attribute("gen_ai.operation.name", "execute_tool")
            tool.set_attribute("gen_ai.tool.name", name)
            tool.set_attribute("tool.name", name)
            tool.set_attribute("session.id", session_id)
            tool.set_attribute(INPUT, _truncate(_json(block.get("input", {}))))
            result = results.get(block.get("id"))
            if result:
                tool.set_attribute(OUTPUT, _truncate(result))
            tool.end(end_time=_ns(finished))
            tools += 1

        turn.end(end_time=_ns(finished))

    root.set_attribute(OUTPUT, _truncate(last_text))
    root.end(end_time=_ns(end))
    return turns, tools


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--session", type=Path, required=True, help="subagent transcript .jsonl")
    parser.add_argument("--agent-name", default="external-interest-sync-agent")
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    load_dotenv(ENV_FILE)
    if not args.session.is_file():
        print(f"No transcript at {args.session}", file=sys.stderr)
        return 1

    rows = load_rows(args.session)
    if not rows:
        print(f"No messages in {args.session.name}", file=sys.stderr)
        return 1

    if args.dry_run:
        # Count the real calls without printing span bodies.
        turns = sum(1 for r in rows if r["type"] == "assistant" and isinstance(r["message"].get("content"), list))
        tools = sum(1 for r in rows if r["type"] == "assistant" and isinstance(r["message"].get("content"), list) for b in r["message"]["content"] if isinstance(b, dict) and b.get("type") == "tool_use")
        print(f"{args.session.name}: {turns} assistant messages, {tools} tool calls (dry run, not sent).")
        return 0

    if not os.environ.get("OTEL_EXPORTER_OTLP_TRACES_HEADERS"):
        print("OTEL_EXPORTER_OTLP_TRACES_HEADERS is not set in test-agent/.env", file=sys.stderr)
        return 1

    service_name = os.environ.get("OTEL_SERVICE_NAME") or args.agent_name
    provider = TracerProvider(resource=Resource.create({SERVICE_NAME: service_name}))
    provider.add_span_processor(
        BatchSpanProcessor(OTLPSpanExporter(), max_export_batch_size=8, schedule_delay_millis=500)
    )
    trace_api.set_tracer_provider(provider)
    tracer = trace_api.get_tracer(service_name)

    turns, tools = export_rows(rows, tracer, service_name, args.session.stem)
    flushed = provider.force_flush(timeout_millis=30_000)
    provider.shutdown()
    if not flushed:
        print(f"Export of {args.session.name} did not flush.", file=sys.stderr)
        return 1
    print(f"{args.session.name}: {turns} LLM turns, {tools} tool calls sent to Agent Score.")
    return 0


if __name__ == "__main__":
    sys.exit(main())

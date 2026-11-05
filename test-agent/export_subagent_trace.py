#!/usr/bin/env python3
"""Export one Cursor subagent transcript to Agent Score.

The docs-sync agent runs inside Cursor, so its model and tool calls are the
transcript Cursor already wrote. This sends that run as one OpenInference
trace. The ingest key is read from test-agent/.env and is never printed.
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
from opentelemetry.sdk.trace.export import SimpleSpanProcessor, SpanExportResult
from opentelemetry.trace import set_span_in_context

ENV_FILE = Path(__file__).resolve().parent / ".env"
MAX_ATTR_CHARS = 4_000
KEY_RE = re.compile(r"tk_[A-Za-z0-9_-]+")
USER_QUERY_RE = re.compile(r"<user_query>\s*(.*?)\s*</user_query>", re.DOTALL)

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
        raw = content
    elif isinstance(content, list):
        raw = "\n".join(
            block.get("text") or ""
            for block in content
            if isinstance(block, dict) and block.get("type") == "text"
        )
    else:
        raw = ""
    queries = USER_QUERY_RE.findall(raw)
    if queries:
        return "\n\n".join(q.strip() for q in queries if q.strip())
    return raw.strip()


def _json(value) -> str:
    if isinstance(value, str):
        return value
    return json.dumps(value, default=str)


def load_rows(path: Path) -> list[dict]:
    rows = []
    with path.open() as handle:
        for line in handle:
            line = line.strip()
            if not line:
                continue
            row = json.loads(line)
            if row.get("role") in ("user", "assistant"):
                rows.append(row)
    return rows


def _ns(moment: datetime) -> int:
    return int(moment.timestamp() * 1_000_000_000)


def export_rows(rows: list[dict], tracer, agent_name: str, model: str, session_id: str, start: datetime, end: datetime) -> tuple[int, int]:
    if end <= start:
        end = start
    span = (end - start) / max(len(rows), 1)
    times = [start + span * i for i in range(len(rows))]
    times.append(end)

    first_user = ""
    for row in rows:
        if row.get("role") == "user":
            first_user = _text(row.get("message", {}).get("content"))
            if first_user:
                break

    root = tracer.start_span(f"{agent_name}.run", start_time=_ns(start))
    root.set_attribute(SPAN_KIND, "AGENT")
    root.set_attribute("gen_ai.operation.name", "invoke_agent")
    root.set_attribute("gen_ai.agent.name", agent_name)
    root.set_attribute("gen_ai.system", "cursor")
    root.set_attribute("session.id", session_id)
    root.set_attribute(INPUT, _truncate(first_user))
    root_ctx = set_span_in_context(root)

    turns = 0
    tools = 0
    pending_user = first_user
    last_text = ""

    for index, row in enumerate(rows):
        if row.get("role") == "user":
            pending_user = _text(row.get("message", {}).get("content")) or pending_user
            continue
        content = row.get("message", {}).get("content")
        if not isinstance(content, list):
            continue
        text_out = _text(content)
        tool_blocks = [
            block for block in content if isinstance(block, dict) and block.get("type") == "tool_use"
        ]
        if not text_out and not tool_blocks:
            continue

        turn = tracer.start_span(
            "gen_ai.chat",
            context=root_ctx,
            start_time=_ns(times[index]),
        )
        turn.set_attribute(SPAN_KIND, "LLM")
        turn.set_attribute("gen_ai.operation.name", "chat")
        turn.set_attribute("gen_ai.system", "cursor")
        turn.set_attribute("gen_ai.request.model", model)
        turn.set_attribute("llm.model_name", model)
        turn.set_attribute("session.id", session_id)
        turn.set_attribute(INPUT, _truncate(pending_user))
        if text_out:
            clipped = _truncate(text_out)
            turn.set_attribute(OUTPUT, clipped)
            last_text = text_out
        turn_ctx = set_span_in_context(turn)
        turns += 1

        for block in tool_blocks:
            name = block.get("name") or "tool"
            tool = tracer.start_span(
                f"tool.{name}",
                context=turn_ctx,
                start_time=_ns(times[index]),
            )
            tool.set_attribute(SPAN_KIND, "TOOL")
            tool.set_attribute("gen_ai.operation.name", "execute_tool")
            tool.set_attribute("gen_ai.tool.name", name)
            tool.set_attribute("tool.name", name)
            tool.set_attribute("session.id", session_id)
            tool.set_attribute(INPUT, _truncate(_json(block.get("input", {}))))
            tool.end(end_time=_ns(times[index + 1]))
            tools += 1

        turn.end(end_time=_ns(times[index + 1]))

    root.set_attribute(OUTPUT, _truncate(last_text))
    root.end(end_time=_ns(end))
    return turns, tools


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--session", type=Path, required=True)
    parser.add_argument("--agent-name", default="AgentScore docs sync")
    parser.add_argument("--model", default="cursor")
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

    stat = args.session.stat()
    start = datetime.fromtimestamp(getattr(stat, "st_birthtime", stat.st_mtime), tz=timezone.utc)
    end = datetime.fromtimestamp(stat.st_mtime, tz=timezone.utc)

    service_name = os.environ.get("OTEL_SERVICE_NAME") or args.agent_name
    if args.dry_run or not os.environ.get("OTEL_EXPORTER_OTLP_TRACES_HEADERS"):
        from opentelemetry.sdk.trace.export import ConsoleSpanExporter

        exporter = ConsoleSpanExporter()
        destination = "console"
    else:
        exporter = OTLPSpanExporter()
        destination = "Agent Score"

    provider = TracerProvider(resource=Resource.create({SERVICE_NAME: service_name}))
    # One span per request. A batch is rejected whole when any span trips the
    # ingest gateway, which drops the spans around it.
    accepted = 0
    rejected = 0

    class _CountingExporter:
        def export(self, spans):
            nonlocal accepted, rejected
            result = exporter.export(spans)
            if result is SpanExportResult.SUCCESS:
                accepted += len(spans)
            else:
                rejected += len(spans)
            return result

        def shutdown(self):
            exporter.shutdown()

        def force_flush(self, timeout_millis=30000):
            return exporter.force_flush(timeout_millis)

    provider.add_span_processor(SimpleSpanProcessor(_CountingExporter()))
    trace_api.set_tracer_provider(provider)
    tracer = trace_api.get_tracer(service_name)

    if args.dry_run:
        # Count the real calls without printing span bodies. Console export
        # would dump tool inputs, which can be large.
        turns = 0
        tools = 0
        for row in rows:
            content = row.get("message", {}).get("content")
            if row.get("role") != "assistant" or not isinstance(content, list):
                continue
            tool_blocks = [b for b in content if isinstance(b, dict) and b.get("type") == "tool_use"]
            text_out = _text(content)
            if text_out or tool_blocks:
                turns += 1
                tools += len(tool_blocks)
        provider.shutdown()
        print(f"{args.session.name}: {turns} LLM turns, {tools} tool calls (dry run, not sent).")
        return 0

    turns, tools = export_rows(
        rows,
        tracer,
        service_name,
        args.model,
        args.session.stem,
        start,
        end,
    )
    flushed = provider.force_flush(timeout_millis=30_000)
    provider.shutdown()
    if not flushed:
        print(f"Export of {args.session.name} did not flush.", file=sys.stderr)
        return 1
    note = f"{args.session.name}: {turns} LLM turns, {tools} tool calls sent to {destination}."
    if rejected:
        note += f" {rejected} spans were rejected by the ingest gateway."
    print(note)
    if accepted == 0 and rejected:
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())

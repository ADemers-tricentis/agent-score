"""Replay a Cursor agent transcript as one AgentScore trace.

Cursor sessions are not Claude Code transcripts, so export_claude_session.py
cannot read them. This script reads the jsonl Cursor already wrote and sends
the same span shape: one agent root, one LLM span per assistant turn, and one
tool span per tool call.

The ingest key comes from the environment, normally written by the Agent Score
MCP (`create_ingest_key`) into test-agent/.env as the standard
OTEL_EXPORTER_OTLP_TRACES_* variables. This script never prints that key.

Usage:
    python export_cursor_session.py --latest --agent-name agent-score-docs-sync
    python export_cursor_session.py --session <path-to-session.jsonl>
"""

import argparse
import json
import os
import re
from datetime import datetime, timezone
from pathlib import Path

from dotenv import load_dotenv
from opentelemetry.trace import set_span_in_context

import genai_semconv as gs
import langfuse_semconv as lf
from otel_setup import configure_agent_score, get_tracer

load_dotenv()

# Kept small on purpose. A batch of long tool outputs is rejected by the
# ingest gateway with 403 Forbidden.
MAX_ATTR_CHARS = 2_000
KEY_RE = re.compile(r"tk_[A-Za-z0-9]+")
USER_QUERY_RE = re.compile(r"<user_query>\s*(.*?)\s*</user_query>", re.DOTALL)


def _cursor_projects_dir() -> Path:
    return Path.home() / ".cursor" / "projects"


def _project_slug(cwd: str) -> str:
    # Cursor's project folder replaces every non-alphanumeric character, so
    # "a.demers" becomes "a-demers". The leading slash is dropped, not kept
    # as a leading hyphen.
    return re.sub(r"[^A-Za-z0-9]", "-", cwd.lstrip("/"))


def find_latest_session(cwd: str) -> Path:
    project = _cursor_projects_dir() / _project_slug(cwd) / "agent-transcripts"
    sessions = sorted(project.glob("*/*.jsonl"), key=lambda p: p.stat().st_mtime)
    sessions = [p for p in sessions if p.parent.name == p.stem and "subagents" not in p.parts]
    if not sessions:
        raise SystemExit(f"No Cursor session transcripts found under {project}")
    return sessions[-1]


def _truncate(text: str) -> str:
    text = KEY_RE.sub("tk_REDACTED", text)
    if len(text) <= MAX_ATTR_CHARS:
        return text
    return text[:MAX_ATTR_CHARS] + f"... [truncated {len(text) - MAX_ATTR_CHARS} chars]"


def _user_text(content) -> str:
    if isinstance(content, str):
        raw = content
    elif isinstance(content, list):
        parts = []
        for block in content:
            if isinstance(block, dict) and block.get("type") == "text":
                parts.append(block.get("text") or "")
        raw = "\n".join(parts)
    else:
        raw = ""
    queries = USER_QUERY_RE.findall(raw)
    if queries:
        return "\n\n".join(q.strip() for q in queries if q.strip())
    return raw.strip()


def _load(path: Path) -> list[dict]:
    rows = []
    with open(path) as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            d = json.loads(line)
            if d.get("role") in ("user", "assistant"):
                rows.append(d)
    return rows


def _ns(dt: datetime) -> int:
    return int(dt.timestamp() * 1_000_000_000)


def convert(rows: list[dict], tracer, agent_name: str, session_id: str, start: datetime, end: datetime) -> tuple[int, int]:
    if not rows or end <= start:
        end = start

    span = (end - start) / max(len(rows), 1)
    times = [start + span * i for i in range(len(rows))]
    times.append(end)

    first_user = ""
    for row in rows:
        if row.get("role") == "user":
            first_user = _user_text(row.get("message", {}).get("content"))
            if first_user:
                break

    last_text = ""
    root = tracer.start_span(f"{agent_name}.run", start_time=_ns(start))
    root.set_attribute(lf.OBSERVATION_TYPE, "agent")
    root.set_attribute(lf.TRACE_INPUT, _truncate(first_user))
    root.set_attribute(lf.OBSERVATION_INPUT, _truncate(first_user))
    root.set_attribute(gs.GEN_AI_AGENT_NAME, agent_name)
    root.set_attribute(gs.GEN_AI_OPERATION_NAME, "invoke_agent")
    root.set_attribute(gs.OPENINFERENCE_SPAN_KIND, "AGENT")
    root.set_attribute(lf.SESSION_ID, session_id)
    root.set_attribute("gen_ai.system", "cursor")
    root_ctx = set_span_in_context(root)

    turns = 0
    tools = 0
    pending_user = first_user

    for i, row in enumerate(rows):
        if row.get("role") == "user":
            pending_user = _user_text(row.get("message", {}).get("content")) or pending_user
            continue
        content = row.get("message", {}).get("content")
        if not isinstance(content, list):
            continue
        text_out = "\n".join(
            block.get("text") or ""
            for block in content
            if isinstance(block, dict) and block.get("type") == "text"
        ).strip()
        tool_blocks = [
            block for block in content if isinstance(block, dict) and block.get("type") == "tool_use"
        ]
        if not text_out and not tool_blocks:
            continue

        turn_start = times[i]
        turn_end = times[i + 1]
        turn = tracer.start_span("gen_ai.chat", context=root_ctx, start_time=_ns(turn_start))
        turn.set_attribute(lf.OBSERVATION_TYPE, "generation")
        turn.set_attribute(lf.OBSERVATION_MODEL, "grok-4.7")
        turn.set_attribute(gs.GEN_AI_OPERATION_NAME, "chat")
        turn.set_attribute(gs.OPENINFERENCE_SPAN_KIND, "LLM")
        turn.set_attribute("gen_ai.system", "cursor")
        turn.set_attribute(gs.GEN_AI_REQUEST_MODEL, "grok-4.7")
        turn.set_attribute(lf.OBSERVATION_INPUT, _truncate(pending_user))
        turn.set_attribute(gs.INPUT, _truncate(pending_user))
        if text_out:
            turn.set_attribute(lf.OBSERVATION_OUTPUT, _truncate(text_out))
            turn.set_attribute(gs.OUTPUT, _truncate(text_out))
            last_text = text_out
        turn_ctx = set_span_in_context(turn)
        turns += 1

        for block in tool_blocks:
            tools += 1
            name = block.get("name") or "tool"
            tool = tracer.start_span(f"tool.{name}", context=turn_ctx, start_time=_ns(turn_start))
            tool.set_attribute(lf.OBSERVATION_TYPE, "tool")
            raw_input = _truncate(lf.to_json(block.get("input", {})))
            tool.set_attribute(lf.OBSERVATION_INPUT, raw_input)
            tool.set_attribute(gs.INPUT, raw_input)
            tool.set_attribute(gs.GEN_AI_OPERATION_NAME, "execute_tool")
            tool.set_attribute(gs.GEN_AI_TOOL_NAME, name)
            tool.set_attribute(gs.OPENINFERENCE_SPAN_KIND, "TOOL")
            tool.set_attribute("tool.name", name)
            tool.end(end_time=_ns(turn_end))

        turn.end(end_time=_ns(turn_end))

    root.set_attribute(lf.TRACE_OUTPUT, _truncate(last_text))
    root.set_attribute(lf.OBSERVATION_OUTPUT, _truncate(last_text))
    root.end(end_time=_ns(end))
    return turns, tools


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--session", type=Path, help="Path to a Cursor session jsonl")
    parser.add_argument("--latest", action="store_true", help="Use the newest session for --cwd")
    parser.add_argument("--cwd", default=os.getcwd(), help="Project directory the Cursor session belongs to")
    parser.add_argument("--agent-name", default="agent-score-docs-sync")
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    if not args.session and not args.latest:
        parser.error("pass --session <file> or --latest")

    # git toplevel when invoked from test-agent
    cwd = args.cwd
    if cwd.endswith("/test-agent"):
        cwd = str(Path(cwd).parent)

    session_path = args.session or find_latest_session(cwd)
    rows = _load(session_path)
    if not rows:
        print(f"No messages in {session_path}")
        return

    st = session_path.stat()
    start = datetime.fromtimestamp(getattr(st, "st_birthtime", st.st_mtime), tz=timezone.utc)
    end = datetime.fromtimestamp(st.st_mtime, tz=timezone.utc)
    if end <= start:
        end = datetime.now(timezone.utc)

    configure_agent_score(args.agent_name, force_console=args.dry_run, max_export_batch_size=8)
    tracer = get_tracer(args.agent_name)
    turns, tools = convert(rows, tracer, args.agent_name, session_path.stem, start, end)

    from opentelemetry import trace as trace_api

    provider = trace_api.get_tracer_provider()
    provider.force_flush()
    provider.shutdown()

    mode = "printed to console (dry run)" if args.dry_run else "sent to AgentScore"
    print(f"Converted {session_path.name}: {turns} LLM turns, {tools} tool calls - {mode}.")
    if not args.dry_run and not os.environ.get("OTEL_EXPORTER_OTLP_TRACES_HEADERS") and not os.environ.get("AGENT_SCORE_API_KEY"):
        print("Note: no ingest key was set, so this went to the console, not AgentScore.")


if __name__ == "__main__":
    main()

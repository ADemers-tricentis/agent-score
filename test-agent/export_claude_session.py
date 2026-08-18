"""Convert a Claude Code session transcript (.jsonl) into an AgentScore trace.

Lets a Claude Code skill run (e.g. agent-score-docs-sync) show up in
AgentScore as a real scored agent, without instrumenting the skill itself.
Run this *after* a session finishes - it reads the transcript Claude Code
already wrote to disk and replays it as OTel spans with real historical
timestamps, using the same span shape as rag_agent.py:

    root "invoke_agent" span
      -> one "gen_ai.chat" span per assistant turn (real token usage/cost)
           -> one "tool.<name>" span per tool_use/tool_result pair in that turn

Transcript location (Claude Code default):
    ~/.claude/projects/<slugified-cwd>/<session-id>.jsonl

Usage:
    python export_claude_session.py --latest --agent-name agent-score-docs-sync
    python export_claude_session.py --session <path-to-session>.jsonl
    python export_claude_session.py --latest --since 2026-08-18T14:03:00Z
    python export_claude_session.py --latest --dry-run   # preview, no network
"""

import argparse
import json
import os
import re
import subprocess
from datetime import datetime
from pathlib import Path

from dotenv import load_dotenv
from opentelemetry.trace import Status, StatusCode, set_span_in_context

import genai_semconv as gs
import langfuse_semconv as lf
from otel_setup import configure_agent_score, get_tracer

load_dotenv()

TRANSCRIPTS_DIR = Path.home() / ".claude" / "projects"

# List-rate $/million tokens, by model prefix. Extend as new models show up
# in transcripts. Falls back to the Sonnet rate if the model isn't listed.
PRICING = {
    "claude-opus": (15.00, 75.00),
    "claude-sonnet": (3.00, 15.00),
    "claude-haiku": (0.80, 4.00),
}
DEFAULT_PRICING = PRICING["claude-sonnet"]


def _default_cwd() -> str:
    """The repo root Claude Code was launched from, not wherever this script
    happens to be run from (e.g. after `cd test-agent`) - that's what
    Claude Code slugifies into the transcript directory name."""
    try:
        out = subprocess.run(
            ["git", "rev-parse", "--show-toplevel"], capture_output=True, text=True, check=True
        )
        return out.stdout.strip()
    except (subprocess.CalledProcessError, FileNotFoundError):
        return os.getcwd()


def _project_dir_for_cwd(cwd: str) -> Path:
    slug = re.sub(r"[^A-Za-z0-9]", "-", cwd)
    return TRANSCRIPTS_DIR / slug


def find_latest_session(cwd: str) -> Path:
    project_dir = _project_dir_for_cwd(cwd)
    sessions = sorted(project_dir.glob("*.jsonl"), key=lambda p: p.stat().st_mtime)
    if not sessions:
        raise SystemExit(f"No session transcripts found under {project_dir}")
    return sessions[-1]


def _to_ns(iso_ts: str) -> int:
    dt = datetime.fromisoformat(iso_ts.replace("Z", "+00:00"))
    return int(dt.timestamp() * 1_000_000_000)


def _price_for(model: str) -> tuple[float, float]:
    for prefix, price in PRICING.items():
        if model.startswith(prefix):
            return price
    return DEFAULT_PRICING


def _content_to_text(content) -> str:
    if isinstance(content, str):
        return content
    return lf.to_json(content)


def load_events(path: Path, since: str | None, until: str | None) -> list[dict]:
    events = []
    with open(path) as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            d = json.loads(line)
            if d.get("type") not in ("assistant", "user"):
                continue
            ts = d.get("timestamp")
            if not ts:
                continue
            if since and ts < since:
                continue
            if until and ts > until:
                continue
            events.append(d)
    return events


def build_tool_result_index(events: list[dict]) -> dict[str, dict]:
    """Map tool_use_id -> the tool_result block (+ its message timestamp)."""
    index = {}
    for e in events:
        if e.get("type") != "user":
            continue
        content = e.get("message", {}).get("content")
        if not isinstance(content, list):
            continue
        for block in content:
            if isinstance(block, dict) and block.get("type") == "tool_result":
                index[block["tool_use_id"]] = {"block": block, "timestamp": e["timestamp"]}
    return index


def convert(events: list[dict], tracer, agent_name: str) -> tuple[int, int]:
    """Build and end the span tree. Returns (turn_count, tool_call_count)."""
    assistant_events = [e for e in events if e.get("type") == "assistant"]
    if not assistant_events:
        return 0, 0

    tool_results = build_tool_result_index(events)

    first_user_text = next(
        (
            e["message"]["content"]
            for e in events
            if e.get("type") == "user"
            and isinstance(e.get("message", {}).get("content"), str)
            and not e["message"]["content"].lstrip().startswith("<")
        ),
        "",
    )
    last_assistant_text = ""
    for e in reversed(assistant_events):
        for block in e["message"]["content"]:
            if block.get("type") == "text":
                last_assistant_text = block["text"]
                break
        if last_assistant_text:
            break

    root_start = _to_ns(events[0]["timestamp"])
    root_end = _to_ns(events[-1]["timestamp"])
    root_span = tracer.start_span(f"{agent_name}.run", start_time=root_start)
    root_span.set_attribute(lf.OBSERVATION_TYPE, "agent")
    root_span.set_attribute(lf.TRACE_INPUT, first_user_text)
    root_span.set_attribute(lf.OBSERVATION_INPUT, first_user_text)
    root_span.set_attribute(gs.GEN_AI_AGENT_NAME, agent_name)
    root_span.set_attribute(gs.GEN_AI_OPERATION_NAME, "invoke_agent")
    root_span.set_attribute(gs.OPENINFERENCE_SPAN_KIND, "AGENT")
    root_span.set_attribute("gen_ai.system", "anthropic")
    root_ctx = set_span_in_context(root_span)

    turn_count = 0
    tool_call_count = 0

    for i, e in enumerate(assistant_events):
        msg = e["message"]
        model = msg.get("model", "unknown")
        usage = msg.get("usage", {})
        input_tokens = usage.get("input_tokens", 0) + usage.get("cache_read_input_tokens", 0) + usage.get("cache_creation_input_tokens", 0)
        output_tokens = usage.get("output_tokens", 0)
        price_in, price_out = _price_for(model)

        turn_start = _to_ns(e["timestamp"])
        turn_end = _to_ns(assistant_events[i + 1]["timestamp"]) if i + 1 < len(assistant_events) else root_end
        if turn_end < turn_start:
            turn_end = turn_start

        turn_span = tracer.start_span("gen_ai.chat", context=root_ctx, start_time=turn_start)
        turn_span.set_attribute(lf.OBSERVATION_TYPE, "generation")
        turn_span.set_attribute(lf.OBSERVATION_MODEL, model)
        turn_span.set_attribute(gs.GEN_AI_OPERATION_NAME, "chat")
        turn_span.set_attribute(gs.OPENINFERENCE_SPAN_KIND, "LLM")
        turn_span.set_attribute("gen_ai.system", "anthropic")
        turn_span.set_attribute(gs.GEN_AI_REQUEST_MODEL, model)
        turn_span.set_attribute(gs.GEN_AI_USAGE_INPUT_TOKENS, input_tokens)
        turn_span.set_attribute(gs.GEN_AI_USAGE_OUTPUT_TOKENS, output_tokens)
        turn_span.set_attribute(lf.OBSERVATION_USAGE_DETAILS, lf.usage_details(input_tokens, output_tokens))
        turn_span.set_attribute(lf.OBSERVATION_COST_DETAILS, lf.cost_details(input_tokens, output_tokens, price_in, price_out))
        turn_ctx = set_span_in_context(turn_span)
        turn_count += 1

        text_out = ""
        for block in msg["content"]:
            if block.get("type") == "text":
                text_out = block["text"]
            elif block.get("type") == "tool_use":
                tool_call_count += 1
                result = tool_results.get(block["id"])
                tool_start = turn_start
                tool_end = _to_ns(result["timestamp"]) if result else turn_end
                if tool_end < tool_start:
                    tool_end = tool_start

                tool_span = tracer.start_span(f"tool.{block['name']}", context=turn_ctx, start_time=tool_start)
                tool_span.set_attribute(lf.OBSERVATION_TYPE, "tool")
                tool_input_json = lf.to_json(block.get("input", {}))
                tool_span.set_attribute(lf.OBSERVATION_INPUT, tool_input_json)
                tool_span.set_attribute(gs.INPUT, tool_input_json)
                tool_span.set_attribute(gs.GEN_AI_OPERATION_NAME, "execute_tool")
                tool_span.set_attribute(gs.GEN_AI_TOOL_NAME, block["name"])
                tool_span.set_attribute(gs.OPENINFERENCE_SPAN_KIND, "TOOL")
                tool_span.set_attribute("tool.name", block["name"])

                if result:
                    out_block = result["block"]
                    out_text = _content_to_text(out_block.get("content", ""))
                    tool_span.set_attribute(lf.OBSERVATION_OUTPUT, out_text)
                    tool_span.set_attribute(gs.OUTPUT, out_text)
                    if out_block.get("is_error"):
                        tool_span.set_attribute(lf.OBSERVATION_LEVEL, "ERROR")
                        tool_span.set_status(Status(StatusCode.ERROR, "tool call failed"))
                tool_span.end(end_time=tool_end)

        turn_span.end(end_time=turn_end)

    root_span.set_attribute(lf.TRACE_OUTPUT, last_assistant_text)
    root_span.set_attribute(lf.OBSERVATION_OUTPUT, last_assistant_text)
    root_span.end(end_time=root_end)
    return turn_count, tool_call_count


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--session", type=Path, help="Path to a specific session .jsonl file")
    parser.add_argument("--latest", action="store_true", help="Use the most recently modified session for --cwd")
    parser.add_argument("--cwd", default=_default_cwd(), help="Project cwd to look up transcripts for (default: git repo root)")
    parser.add_argument("--since", help="Only convert events at/after this ISO8601 timestamp (e.g. 2026-08-18T14:03:00Z)")
    parser.add_argument("--until", help="Only convert events at/before this ISO8601 timestamp")
    parser.add_argument("--agent-name", default="agent-score-docs-sync", help="gen_ai.agent.name / service name in AgentScore")
    parser.add_argument("--dry-run", action="store_true", help="Print span summary, don't export")
    parser.add_argument(
        "--full-session", action="store_true",
        help="Explicitly allow converting the whole session (no --since/--until) into ONE trace. "
             "Without this, a real export requires --since or --until - a bare --latest send once "
             "turned an entire ~4h session into a single giant root-span trace.",
    )
    args = parser.parse_args()

    if not args.session and not args.latest:
        parser.error("pass --session <file> or --latest")

    if not args.dry_run and not args.since and not args.until and not args.full_session:
        parser.error(
            "refusing to export the whole session as one trace - pass --since <ISO ts> to scope "
            "this to a single run (the Stop hook does this automatically), --full-session if you "
            "really mean the entire session, or --dry-run to just preview."
        )

    session_path = args.session or find_latest_session(args.cwd)
    events = load_events(session_path, args.since, args.until)
    if not events:
        print(f"No events found in {session_path} for the given time range.")
        return

    span_hours = (_to_ns(events[-1]["timestamp"]) - _to_ns(events[0]["timestamp"])) / 1e9 / 3600
    print(f"Time range: {events[0]['timestamp']} -> {events[-1]['timestamp']} ({span_hours:.2f}h, {len(events)} events)")

    configure_agent_score(args.agent_name, force_console=args.dry_run)
    tracer = get_tracer(args.agent_name)
    turn_count, tool_call_count = convert(events, tracer, args.agent_name)

    from opentelemetry import trace as trace_api

    provider = trace_api.get_tracer_provider()
    provider.force_flush()
    provider.shutdown()

    mode = "printed to console (dry run)" if args.dry_run else "sent to AgentScore"
    print(
        f"Converted {session_path.name}: {turn_count} LLM turns, {tool_call_count} tool calls - {mode}."
    )
    if not args.dry_run and not os.environ.get("AGENT_SCORE_API_KEY"):
        print("Note: AGENT_SCORE_API_KEY was not set, so this actually went to the console, not AgentScore.")


if __name__ == "__main__":
    main()

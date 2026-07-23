import json
import time
import uuid
from datetime import datetime, timezone

import anthropic

from tools import TOOL_DEFINITIONS, execute_tool

MODEL = "claude-haiku-4-5-20251001"

client = anthropic.Anthropic()


def _serialize_content(content) -> list:
    """Convert SDK content blocks to plain dicts for JSON serialization."""
    result = []
    for block in content:
        if hasattr(block, "type"):
            b = {"type": block.type}
            if block.type == "text":
                b["text"] = block.text
            elif block.type == "tool_use":
                b["id"] = block.id
                b["name"] = block.name
                b["input"] = block.input
            elif block.type == "tool_result":
                b["tool_use_id"] = block.tool_use_id
                b["content"] = block.content
            result.append(b)
        elif isinstance(block, dict):
            result.append(block)
    return result


def run_agent(task: str, scenario: str = "", system: str = "") -> dict:
    """
    Run the agent on a task and return a complete trace dict.

    The trace includes the full message history, per-call tool logs,
    token usage, and timing - ready to write to JSON.
    """
    session_id = f"s-{uuid.uuid4().hex[:8]}"
    start_ts = datetime.now(timezone.utc).isoformat()
    t0 = time.perf_counter()

    messages = [{"role": "user", "content": task}]
    tool_calls_log: list[dict] = []
    total_input_tokens = 0
    total_output_tokens = 0
    turn_count = 0
    final_text = ""

    print(f"\n[{session_id}] {scenario or task[:70]}")

    while True:
        kwargs = dict(
            model=MODEL,
            max_tokens=2048,
            tools=TOOL_DEFINITIONS,
            messages=messages,
        )
        if system:
            kwargs["system"] = system

        response = client.messages.create(**kwargs)
        turn_count += 1
        total_input_tokens += response.usage.input_tokens
        total_output_tokens += response.usage.output_tokens

        messages.append({"role": "assistant", "content": _serialize_content(response.content)})

        if response.stop_reason == "end_turn":
            for block in response.content:
                if hasattr(block, "text"):
                    final_text = block.text
                    break
            print(f"  done — {turn_count} turns, {len(tool_calls_log)} tool calls")
            break

        if response.stop_reason != "tool_use":
            break

        tool_results = []
        for block in response.content:
            if block.type != "tool_use":
                continue

            call_ts = datetime.now(timezone.utc).isoformat()
            result = execute_tool(block.name, block.input)

            print(f"  -> {block.name}({json.dumps(block.input)[:80]})")

            tool_calls_log.append({
                "turn": turn_count,
                "name": block.name,
                "input": block.input,
                "output": result,
                "ts": call_ts,
            })

            tool_results.append({
                "type": "tool_result",
                "tool_use_id": block.id,
                "content": json.dumps(result),
            })

        messages.append({"role": "user", "content": tool_results})

    dur_ms = int((time.perf_counter() - t0) * 1000)

    return {
        "session_id": session_id,
        "ts": start_ts,
        "dur_ms": dur_ms,
        "scenario": scenario or task[:100],
        "task": task,
        "model": MODEL,
        "turn_count": turn_count,
        "tool_call_count": len(tool_calls_log),
        "tool_calls": tool_calls_log,
        "messages": messages,
        "final_response": final_text,
        "usage": {
            "input_tokens": total_input_tokens,
            "output_tokens": total_output_tokens,
        },
    }

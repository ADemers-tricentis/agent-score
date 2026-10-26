#!/usr/bin/env python3
"""SubagentStop hook: when an external-interest-sync subagent finishes,
export its transcript to AgentScore as a trace (see
test-agent/export_claude_session.py).

Unlike the docs-sync Stop hook, no heuristics are needed: each subagent run
has its own transcript at <session>/subagents/agent-<id>.jsonl, so one run
maps to one trace. If the same agent is resumed later, only the events after
the last export are sent.

Never raises / never blocks the SubagentStop event - any failure is logged
to stderr and the hook still exits 0.
"""

import json
import subprocess
import sys
from pathlib import Path

AGENT_TYPES = {"external-interest-sync"}
REPO_ROOT = Path(__file__).resolve().parents[2]
STATE_FILE = REPO_ROOT / ".claude" / "hooks" / ".subagent-trace-exports.json"
VENV_PYTHON = REPO_ROOT / "test-agent" / ".venv" / "bin" / "python"
EXPORT_SCRIPT = REPO_ROOT / "test-agent" / "export_claude_session.py"


def resolve_transcript(payload: dict) -> Path | None:
    """Prefer the path Claude Code hands us; otherwise derive it from the
    parent session's transcript location and the agent id."""
    if payload.get("agent_transcript_path"):
        return Path(payload["agent_transcript_path"])
    parent, agent_id = payload.get("transcript_path"), payload.get("agent_id")
    if parent and agent_id:
        parent = Path(parent)
        return parent.parent / parent.stem / "subagents" / f"agent-{agent_id}.jsonl"
    return None


def resolve_agent_type(payload: dict, transcript: Path) -> str | None:
    if payload.get("agent_type"):
        return payload["agent_type"]
    meta = transcript.with_suffix(".meta.json")
    if meta.exists():
        try:
            return json.loads(meta.read_text()).get("agentType")
        except json.JSONDecodeError:
            return None
    return None


def last_timestamp(transcript: Path) -> str | None:
    last_ts = None
    with open(transcript) as f:
        for line in f:
            try:
                d = json.loads(line)
            except json.JSONDecodeError:
                continue
            if d.get("timestamp"):
                last_ts = d["timestamp"]
    return last_ts


def load_state() -> dict:
    if STATE_FILE.exists():
        try:
            return json.loads(STATE_FILE.read_text())
        except json.JSONDecodeError:
            return {}
    return {}


def save_state(state: dict) -> None:
    STATE_FILE.write_text(json.dumps(state, indent=2))


def main() -> int:
    payload = json.load(sys.stdin)
    transcript = resolve_transcript(payload)
    if not transcript or not transcript.exists():
        return 0

    agent_type = resolve_agent_type(payload, transcript)
    if agent_type not in AGENT_TYPES:
        return 0

    if not VENV_PYTHON.exists() or not EXPORT_SCRIPT.exists():
        print(f"[export-subagent-trace] missing {VENV_PYTHON} or {EXPORT_SCRIPT}, skipping", file=sys.stderr)
        return 0

    key = transcript.stem
    state = load_state()
    end_ts = last_timestamp(transcript)
    if not end_ts or state.get(key) == end_ts:
        return 0  # nothing new since the last export

    cmd = [str(VENV_PYTHON), str(EXPORT_SCRIPT), "--session", str(transcript), "--agent-name", agent_type]
    # First export sends the whole run; a resumed run sends only what's new.
    cmd += ["--since", state[key]] if key in state else ["--full-session"]
    try:
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=120, cwd=EXPORT_SCRIPT.parent)
        if result.returncode != 0:
            print(f"[export-subagent-trace] export failed: {result.stderr}", file=sys.stderr)
        else:
            print(f"[export-subagent-trace] {result.stdout.strip()}", file=sys.stderr)
    except Exception as exc:
        print(f"[export-subagent-trace] error running export: {exc}", file=sys.stderr)

    # Mark handled regardless of outcome, same as the docs-sync hook - a
    # persistent failure should surface once, not retry on every stop.
    state[key] = end_ts
    save_state(state)
    return 0


if __name__ == "__main__":
    sys.exit(main())

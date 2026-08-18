#!/usr/bin/env python3
"""Stop hook: after a turn that invoked the agent-score-docs-sync skill,
export that skill run's slice of the session transcript to AgentScore as a
trace (see test-agent/export_claude_session.py).

Claude Code has no discrete "skill finished" event - the skill runs inline
in the main session. Stop (turn end) is the closest usable proxy, since the
skill's own last step (push + report) happens right before the turn ends.
This hook is therefore a heuristic: it only fires the export if the *most
recent* Skill tool_use in the transcript targeted agent-score-docs-sync and
hasn't been exported yet for this session.

Never raises / never blocks the Stop event - any failure is logged to
stderr and the hook still exits 0.
"""

import json
import subprocess
import sys
from pathlib import Path

SKILL_NAME = "agent-score-docs-sync"
REPO_ROOT = Path(__file__).resolve().parents[2]
STATE_FILE = REPO_ROOT / ".claude" / "skills" / SKILL_NAME / ".last-exported.json"
VENV_PYTHON = REPO_ROOT / "test-agent" / "venv" / "bin" / "python"
EXPORT_SCRIPT = REPO_ROOT / "test-agent" / "export_claude_session.py"


def find_last_skill_invocation(transcript_path: str) -> str | None:
    """Return the timestamp of the most recent agent-score-docs-sync
    Skill tool_use in the transcript, or None if there isn't one."""
    last_ts = None
    with open(transcript_path) as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            try:
                d = json.loads(line)
            except json.JSONDecodeError:
                continue
            if d.get("type") != "assistant":
                continue
            for block in d.get("message", {}).get("content", []):
                if (
                    isinstance(block, dict)
                    and block.get("type") == "tool_use"
                    and block.get("name") == "Skill"
                    and block.get("input", {}).get("skill") == SKILL_NAME
                ):
                    last_ts = d.get("timestamp")
    return last_ts


def load_state() -> dict:
    if STATE_FILE.exists():
        try:
            return json.loads(STATE_FILE.read_text())
        except json.JSONDecodeError:
            return {}
    return {}


def save_state(state: dict) -> None:
    STATE_FILE.parent.mkdir(parents=True, exist_ok=True)
    STATE_FILE.write_text(json.dumps(state, indent=2))


def main() -> int:
    payload = json.load(sys.stdin)
    transcript_path = payload.get("transcript_path")
    session_id = payload.get("session_id", "unknown")

    if not transcript_path or not Path(transcript_path).exists():
        return 0

    invocation_ts = find_last_skill_invocation(transcript_path)
    if not invocation_ts:
        return 0  # this session never ran the skill

    state = load_state()
    if state.get(session_id) == invocation_ts:
        return 0  # already exported this exact invocation

    if not VENV_PYTHON.exists() or not EXPORT_SCRIPT.exists():
        print(f"[export-docs-sync-trace] missing {VENV_PYTHON} or {EXPORT_SCRIPT}, skipping", file=sys.stderr)
        return 0

    cmd = [
        str(VENV_PYTHON),
        str(EXPORT_SCRIPT),
        "--session", transcript_path,
        "--since", invocation_ts,
        "--agent-name", SKILL_NAME,
    ]
    try:
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=60)
        if result.returncode != 0:
            print(f"[export-docs-sync-trace] export failed: {result.stderr}", file=sys.stderr)
        else:
            print(f"[export-docs-sync-trace] {result.stdout.strip()}", file=sys.stderr)
    except Exception as exc:
        print(f"[export-docs-sync-trace] error running export: {exc}", file=sys.stderr)

    # Mark this invocation handled regardless of outcome - a persistent
    # failure (e.g. no venv, bad key) should surface once, not retry-spam
    # on every subsequent Stop in a long session.
    state[session_id] = invocation_ts
    save_state(state)
    return 0


if __name__ == "__main__":
    sys.exit(main())

#!/usr/bin/env python3
"""SubagentStop hook: when external-interest-sync-agent finishes, export its
transcript to AgentScore as a trace (see test-agent/export_claude_subagent_trace.py).

Never raises or blocks - any failure is logged to stderr and the hook exits 0.
"""

import json
import os
import subprocess
import sys
from pathlib import Path

AGENT_TYPE = "external-interest-sync-agent"
REPO_ROOT = Path(__file__).resolve().parents[2]
VENV_PYTHON = REPO_ROOT / "test-agent" / ".venv" / "bin" / "python"
EXPORT_SCRIPT = REPO_ROOT / "test-agent" / "export_claude_subagent_trace.py"


def main() -> int:
    payload = json.load(sys.stdin)
    if payload.get("agent_type") != AGENT_TYPE:
        return 0
    transcript = payload.get("agent_transcript_path")
    if not transcript or not Path(transcript).exists():
        print(f"export-subagent-trace: no transcript at {transcript}", file=sys.stderr)
        return 0

    # .env sets the docs-sync service name; override it so runs land on this agent.
    env = {**os.environ, "OTEL_SERVICE_NAME": AGENT_TYPE}
    result = subprocess.run(
        [str(VENV_PYTHON), str(EXPORT_SCRIPT), "--session", transcript, "--agent-name", AGENT_TYPE],
        env=env, capture_output=True, text=True, timeout=120,
    )
    print(result.stdout.strip() or result.stderr.strip(), file=sys.stderr)
    return 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except Exception as exc:  # never block the subagent stop
        print(f"export-subagent-trace failed: {exc}", file=sys.stderr)
        sys.exit(0)

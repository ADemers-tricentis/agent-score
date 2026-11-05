#!/usr/bin/env python3
"""Export the agentscore-docs-sync-agent run when that subagent stops.

Cursor writes the agent's model and tool calls to its own transcript. This
hook sends that transcript to Agent Score. It never blocks the agent: any
failure is logged and the hook still exits 0.
"""

import json
import os
import re
import subprocess
import sys
from pathlib import Path

AGENT_NAME = "agentscore-docs-sync-agent"
SERVICE_NAME = "AgentScore docs sync"
REPO = Path(__file__).resolve().parents[2]
STATE_FILE = REPO / "test-agent" / ".export-state.json"
VENV_PYTHON = REPO / "test-agent" / "venv" / "bin" / "python"
EXPORT_SCRIPT = REPO / "test-agent" / "export_subagent_trace.py"


def _project_slug(workspace: str) -> str:
    return re.sub(r"[^A-Za-z0-9]", "-", workspace.lstrip("/"))


def _transcript_root(payload: dict) -> Path | None:
    roots = payload.get("workspace_roots") or []
    workspace = roots[0] if roots else str(REPO)
    root = Path.home() / ".cursor" / "projects" / _project_slug(workspace) / "agent-transcripts"
    return root if root.is_dir() else None


def resolve_transcript(payload: dict) -> Path | None:
    explicit = payload.get("agent_transcript_path")
    if explicit and Path(explicit).is_file():
        return Path(explicit)

    root = _transcript_root(payload)
    wanted = {
        name
        for name in (
            payload.get("subagent_id"),
            payload.get("conversation_id"),
        )
        if name
    }
    if root and wanted:
        for path in root.glob("*/subagents/*.jsonl"):
            if path.stem in wanted:
                return path

    search_dirs = []
    parent_transcript = payload.get("transcript_path")
    if parent_transcript:
        search_dirs.append(Path(parent_transcript).parent / "subagents")
    parent_id = payload.get("parent_conversation_id") or payload.get("conversation_id")
    if root and parent_id:
        search_dirs.append(root / parent_id / "subagents")

    newest = None
    for directory in search_dirs:
        if not directory.is_dir():
            continue
        for path in directory.glob("*.jsonl"):
            if newest is None or path.stat().st_mtime > newest.stat().st_mtime:
                newest = path
    return newest


def load_state() -> dict:
    if not STATE_FILE.exists():
        return {}
    try:
        return json.loads(STATE_FILE.read_text())
    except json.JSONDecodeError:
        return {}


def main() -> int:
    try:
        payload = json.load(sys.stdin)
    except json.JSONDecodeError:
        print("{}", flush=True)
        return 0

    if payload.get("subagent_type") != AGENT_NAME:
        print("{}", flush=True)
        return 0
    if payload.get("status") == "aborted":
        print("{}", flush=True)
        return 0

    transcript = resolve_transcript(payload)
    if transcript is None:
        print("[docs-sync-agent] no subagent transcript to export", file=sys.stderr)
        print("{}", flush=True)
        return 0

    marker = f"{transcript}:{int(transcript.stat().st_mtime)}"
    state = load_state()
    if state.get("last") == marker:
        print("{}", flush=True)
        return 0

    if not VENV_PYTHON.exists() or not EXPORT_SCRIPT.exists():
        print(f"[docs-sync-agent] missing {VENV_PYTHON} or {EXPORT_SCRIPT}", file=sys.stderr)
        print("{}", flush=True)
        return 0

    model = payload.get("subagent_model") or payload.get("model") or "cursor"
    # .env may name another agent. Override it so this run lands on AgentScore docs sync.
    env = {**os.environ, "OTEL_SERVICE_NAME": SERVICE_NAME}
    try:
        result = subprocess.run(
            [
                str(VENV_PYTHON),
                str(EXPORT_SCRIPT),
                "--session",
                str(transcript),
                "--agent-name",
                SERVICE_NAME,
                "--model",
                model,
            ],
            env=env,
            capture_output=True,
            text=True,
            timeout=55,
        )
    except Exception as exc:
        print(f"[docs-sync-agent] export error: {exc}", file=sys.stderr)
        print("{}", flush=True)
        return 0

    if result.returncode != 0:
        detail = (result.stderr or result.stdout).strip()
        print(f"[docs-sync-agent] export failed: {detail}", file=sys.stderr)
        print("{}", flush=True)
        return 0

    STATE_FILE.parent.mkdir(parents=True, exist_ok=True)
    STATE_FILE.write_text(json.dumps({"last": marker}))
    note = result.stdout.strip()
    if note:
        print(f"[docs-sync-agent] {note}", file=sys.stderr)
    print("{}", flush=True)
    return 0


if __name__ == "__main__":
    sys.exit(main())

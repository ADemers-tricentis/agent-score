#!/usr/bin/env python3
"""
Run test agent scenarios and save traces to ./traces/.

Usage:
    python run.py              # run all scenarios
    python run.py 0            # run scenario at index 0
    python run.py --list       # list available scenarios
"""

import json
import os
import sys
from pathlib import Path

if not os.environ.get("ANTHROPIC_API_KEY"):
    print("Error: ANTHROPIC_API_KEY environment variable is not set.")
    print("  export ANTHROPIC_API_KEY=sk-ant-...")
    sys.exit(1)

from agent import run_agent
from scenarios import SCENARIOS

TRACES_DIR = Path(__file__).parent / "traces"


def list_scenarios():
    for i, s in enumerate(SCENARIOS):
        print(f"  [{i}] {s['scenario']}")


def main():
    if "--list" in sys.argv:
        list_scenarios()
        return

    TRACES_DIR.mkdir(exist_ok=True)

    if len(sys.argv) > 1 and sys.argv[1].isdigit():
        idx = int(sys.argv[1])
        if idx >= len(SCENARIOS):
            print(f"Error: index {idx} out of range (0-{len(SCENARIOS)-1})")
            sys.exit(1)
        to_run = [SCENARIOS[idx]]
    else:
        to_run = SCENARIOS

    batch = []
    for s in to_run:
        trace = run_agent(task=s["task"], scenario=s["scenario"])
        batch.append(trace)

        out = TRACES_DIR / f"{trace['session_id']}.json"
        out.write_text(json.dumps(trace, indent=2))
        print(f"  saved -> {out.name}")

    batch_file = TRACES_DIR / "session-batch.json"
    batch_file.write_text(json.dumps(batch, indent=2))
    print(f"\nbatch  -> {batch_file}")
    print(f"total sessions: {len(batch)}")


if __name__ == "__main__":
    main()

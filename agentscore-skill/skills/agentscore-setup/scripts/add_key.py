#!/usr/bin/env python3
"""Add the AgentScore ingest key to .env without it passing through the assistant.

Usage (the user runs it, e.g. with the `!` prefix):
  python3 add_key.py --clipboard            # copy the key in AgentScore first, then run this
  python3 add_key.py                        # prompts with hidden input
  pbpaste | python3 add_key.py --stdin      # any other source

Writes OTEL_EXPORTER_OTLP_TRACES_HEADERS=Authorization=Bearer%20<key> to .env, replacing an earlier
value in place (so it is safe to re-run to rotate a key), sets .env to owner-only permissions, and
refuses to write if .env is not git-ignored in a git repo. It prints only the last four characters.
"""
import argparse
import getpass
import re
import shutil
import subprocess
import sys
import warnings
from pathlib import Path

VAR = "OTEL_EXPORTER_OTLP_TRACES_HEADERS"


def from_clipboard() -> str:
    for cmd in (["pbpaste"], ["wl-paste", "-n"], ["xclip", "-selection", "clipboard", "-o"],
                ["xsel", "--clipboard", "--output"], ["powershell", "-command", "Get-Clipboard"]):
        if shutil.which(cmd[0]):
            return subprocess.run(cmd, capture_output=True, text=True, check=True).stdout
    sys.exit("No clipboard tool found (pbpaste, wl-paste, xclip, xsel). Run without --clipboard to type it instead.")


def ignored(root: Path) -> bool:
    """True if .env is git-ignored, or the directory is not a git repo at all."""
    inside = subprocess.run(["git", "-C", str(root), "rev-parse", "--is-inside-work-tree"],
                            capture_output=True, text=True)
    if inside.returncode != 0:
        return True
    return subprocess.run(["git", "-C", str(root), "check-ignore", "-q", ".env"]).returncode == 0


def main():
    ap = argparse.ArgumentParser()
    src = ap.add_mutually_exclusive_group()
    src.add_argument("--clipboard", action="store_true", help="read the key from the clipboard")
    src.add_argument("--stdin", action="store_true", help="read the key from standard input")
    ap.add_argument("--project-dir", default=".")
    a = ap.parse_args()

    root = Path(a.project_dir)
    if not ignored(root):
        sys.exit(".env is not git-ignored here. Run configure_env.py first so the key cannot be committed.")

    if a.clipboard:
        key = from_clipboard()
    elif a.stdin:
        key = sys.stdin.read()
    else:
        warnings.simplefilter("error", getpass.GetPassWarning)  # never fall back to an echoing prompt
        try:
            key = getpass.getpass("AgentScore ingest key (tk_..., input hidden): ")
        except (EOFError, OSError, getpass.GetPassWarning):
            sys.exit("No terminal for hidden input. Copy the key, then run again with --clipboard.")
    key = key.strip()

    if key.startswith("Authorization=") or key.startswith("Bearer"):
        key = re.sub(r"^(Authorization=)?Bearer(%20|\s+)", "", key)
    if not key.startswith("tk_") or key == "tk_REPLACE_ME" or re.search(r"\s", key) or len(key) < 12:
        sys.exit("That does not look like an ingest key (expected tk_ followed by the key). Nothing was written.")

    env = root / ".env"
    existing = env.read_text() if env.exists() else ""
    line = f"{VAR}=Authorization=Bearer%20{key}"
    pattern = re.compile(rf"^\s*(?:export\s+)?{VAR}\s*=.*$", re.M)
    if pattern.search(existing):
        updated = pattern.sub(lambda _: line, existing, count=1)
        action = "replaced"
    else:
        sep = "" if not existing or existing.endswith("\n") else "\n"
        updated = existing + sep + line + "\n"
        action = "added"
    env.write_text(updated)
    env.chmod(0o600)
    print(f"{VAR} {action} in {env} (key ending ...{key[-4:]}).")


if __name__ == "__main__":
    main()

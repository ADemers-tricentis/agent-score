#!/usr/bin/env python3
"""Copy an eval fixture into a fresh git repo and install its dependencies.

Usage: python prepare_run.py <fixture name> <dest dir>

The initial commit holds only the untouched agent source, so `git diff` against it shows
exactly what a setup run changed. Dependencies are installed afterwards (untracked), the way
a real user's environment already has them before running the skill.
"""
import shutil
import subprocess
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent


def sh(cmd, cwd):
    subprocess.run(cmd, cwd=cwd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.STDOUT)


def main():
    name, dest = sys.argv[1], Path(sys.argv[2]).resolve()
    src = HERE / "fixtures" / name
    if dest.exists():
        shutil.rmtree(dest)
    shutil.copytree(src, dest)
    sh(["git", "init", "-q"], dest)
    sh(["git", "add", "-A"], dest)
    sh(["git", "-c", "user.name=eval", "-c", "user.email=eval@example.com", "commit", "-q", "-m", "untouched agent"], dest)
    if name == "python-openai":
        sh(["uv", "venv", "-q", ".venv"], dest)
        sh(["uv", "pip", "install", "-q", "--python", ".venv/bin/python", "-r", "requirements.txt"], dest)
    elif name == "python-langgraph":
        sh(["uv", "sync", "-q"], dest)
    elif name == "node-vercel-ai":
        sh(["npm", "install", "--silent", "--no-audit", "--no-fund"], dest)
    print(f"prepared {name} at {dest}")


if __name__ == "__main__":
    main()

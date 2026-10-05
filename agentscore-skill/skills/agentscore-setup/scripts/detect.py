#!/usr/bin/env python3
"""Describe an agent project so agentscore-setup can plan its changes.

Usage: python detect.py [project_dir]

Prints one JSON object. It reads dependency manifests and source files only; it
never reads the values in .env files (only whether they exist and which keys are set).
"""
import json
import os
import re
import sys
from pathlib import Path

SKIP_DIRS = {".git", "node_modules", "venv", ".venv", "__pycache__", "dist", "build", ".next", ".tox", "site-packages"}
MARKER = "agentscore-setup:v1"

# dependency name -> label. Order matters: first match wins within a category.
FRAMEWORKS = {
    "langgraph": "langgraph", "langchain": "langchain", "langchain-core": "langchain",
    "@langchain/langgraph": "langgraph", "@langchain/core": "langchain", "langchain-openai": "langchain",
    "llama-index": "llamaindex", "llama-index-core": "llamaindex", "llamaindex": "llamaindex",
    "openai-agents": "openai-agents", "@openai/agents": "openai-agents",
    "crewai": "crewai", "pydantic-ai": "pydantic-ai", "pydantic-ai-slim": "pydantic-ai",
    "google-adk": "google-adk", "autogen-agentchat": "autogen", "ag2": "autogen",
    "ai": "vercel-ai-sdk", "@mastra/core": "mastra", "litellm": "litellm",
}
PROVIDERS = {
    "openai": "openai", "anthropic": "anthropic", "@anthropic-ai/sdk": "anthropic",
    "google-genai": "google-genai", "google-generativeai": "google-genai", "@google/genai": "google-genai",
    "boto3": "bedrock?", "mistralai": "mistral", "cohere": "cohere", "groq": "groq",
    "@ai-sdk/openai": "openai", "@ai-sdk/anthropic": "anthropic", "@ai-sdk/google": "google-genai",
}
OTEL_HINTS = ("opentelemetry", "openinference", "traceloop", "@arizeai", "langfuse", "logfire")


def norm(name: str) -> str:
    return re.split(r"[<>=!~\[; @]", name.strip(), maxsplit=1)[0].lower().replace("_", "-")


def walk(root: Path):
    for dirpath, dirnames, filenames in os.walk(root):
        dirnames[:] = [d for d in dirnames if d not in SKIP_DIRS and not d.startswith(".venv")]
        for f in filenames:
            yield Path(dirpath) / f


def python_deps(root: Path):
    deps, files = set(), []
    for p in root.glob("requirements*.txt"):
        files.append(p.name)
        for line in p.read_text(errors="ignore").splitlines():
            line = line.split("#")[0].strip()
            if line and not line.startswith(("-", "git+", "http")):
                deps.add(norm(line))
    pp = root / "pyproject.toml"
    if pp.exists():
        files.append("pyproject.toml")
        text = pp.read_text(errors="ignore")
        for block in re.findall(r"dependencies\s*=\s*\[(.*?)\]", text, re.S):
            deps.update(norm(m) for m in re.findall(r'"([^"]+)"', block))
        for block in re.findall(r"\[tool\.poetry[^\]]*dependencies\]\n(.*?)(?:\n\[|\Z)", text, re.S):
            deps.update(norm(m) for m in re.findall(r"^([A-Za-z0-9_.\-]+)\s*=", block, re.M))
    if (root / "Pipfile").exists():
        files.append("Pipfile")
        for line in (root / "Pipfile").read_text(errors="ignore").splitlines():
            m = re.match(r"^([A-Za-z0-9_.\-]+)\s*=", line)
            if m:
                deps.add(norm(m.group(1)))
    deps.discard("python")
    return deps, files


def node_deps(root: Path):
    pj = root / "package.json"
    if not pj.exists():
        return set(), {}, False
    data = json.loads(pj.read_text(errors="ignore") or "{}")
    deps = set()
    for k in ("dependencies", "devDependencies", "peerDependencies"):
        deps.update((data.get(k) or {}).keys())
    return deps, data, data.get("type") == "module"


def python_pm(root: Path):
    if (root / "uv.lock").exists() or "[tool.uv" in _read(root / "pyproject.toml"):
        return "uv"
    if (root / "poetry.lock").exists() or "[tool.poetry" in _read(root / "pyproject.toml"):
        return "poetry"
    if (root / "Pipfile").exists():
        return "pipenv"
    return "pip"


def node_pm(root: Path):
    for lock, pm in (("pnpm-lock.yaml", "pnpm"), ("yarn.lock", "yarn"), ("bun.lockb", "bun"), ("bun.lock", "bun"), ("package-lock.json", "npm")):
        if (root / lock).exists():
            return pm
    return "npm"


def _read(p: Path) -> str:
    return p.read_text(errors="ignore") if p.exists() else ""


def env_state(root: Path):
    keys = []
    env = root / ".env"
    if env.exists():
        keys = [m.group(1) for m in re.finditer(r"^\s*(?:export\s+)?([A-Z0-9_]+)\s*=", env.read_text(errors="ignore"), re.M)]
    gi = _read(root / ".gitignore").splitlines()
    return {
        "env_exists": env.exists(),
        "env_keys_set": sorted(k for k in keys if k.startswith(("OTEL_", "AGENTSCORE", "AGENT_SCORE"))),
        "env_example_exists": (root / ".env.example").exists(),
        "env_example_has_agentscore_block": "agentscore-setup" in _read(root / ".env.example"),
        "gitignore_exists": (root / ".gitignore").exists(),
        "gitignore_covers_env": any(l.strip() in (".env", "/.env", ".env*", "*.env") for l in gi),
    }


def scan_sources(root: Path):
    marker_files, entry, otel_setup = [], [], []
    for p in walk(root):
        if p.suffix not in (".py", ".ts", ".js", ".mjs", ".mts", ".tsx"):
            continue
        try:
            text = p.read_text(errors="ignore")
        except OSError:
            continue
        rel = str(p.relative_to(root))
        if MARKER in text:
            marker_files.append(rel)
        if re.search(r"(TracerProvider\(|set_tracer_provider|new NodeSDK|NodeTracerProvider)", text) and MARKER not in text:
            otel_setup.append(rel)
        if p.suffix == ".py" and re.search(r'if __name__ == ["\']__main__["\']|FastAPI\(|Flask\(|\.run\(', text):
            entry.append(rel)
        if p.suffix in (".ts", ".js", ".mjs", ".mts") and re.search(r"(listen\(|serve\(|createServer|main\(\)|process\.argv)", text) and "test" not in rel:
            entry.append(rel)
    return marker_files, entry[:10], otel_setup


def main():
    root = Path(sys.argv[1] if len(sys.argv) > 1 else ".").resolve()
    py, py_files = python_deps(root)
    nd, pkg, is_esm = node_deps(root)
    languages = [l for l, present in (("python", bool(py_files)), ("node", bool(pkg))) if present]
    deps = py | nd
    marker_files, entry, otel_setup = scan_sources(root)
    out = {
        "project_dir": str(root),
        "languages": languages,
        "python": {"package_manager": python_pm(root), "manifests": py_files,
                   "venv": next((d for d in (".venv", "venv") if (root / d).is_dir()), None)} if "python" in languages else None,
        "node": {"package_manager": node_pm(root), "esm": is_esm, "typescript": (root / "tsconfig.json").exists(),
                 "main": pkg.get("main"), "scripts": {k: v for k, v in (pkg.get("scripts") or {}).items() if k in ("start", "dev", "build")},
                 "node_version": _read(root / ".nvmrc").strip() or None} if "node" in languages else None,
        "frameworks": sorted({FRAMEWORKS[d] for d in deps if d in FRAMEWORKS}),
        "providers": sorted({PROVIDERS[d] for d in deps if d in PROVIDERS}),
        "existing_telemetry_deps": sorted(d for d in deps if d.startswith(OTEL_HINTS) or any(h in d for h in OTEL_HINTS)),
        "existing_otel_setup_files": otel_setup,
        "agentscore_bootstrap_files": marker_files,
        "already_set_up": bool(marker_files),
        "entrypoint_candidates": entry,
        "env": env_state(root),
    }
    json.dump(out, sys.stdout, indent=2)
    print()


if __name__ == "__main__":
    main()

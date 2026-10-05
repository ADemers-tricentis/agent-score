#!/usr/bin/env python3
"""Write AgentScore placeholders to .env.example, make sure .env is git-ignored, and fill in .env's
non-secret settings.

Usage:
  python configure_env.py --base-url https://agent-score-ingest.product.tricentis.com \
      --service-name my-agent [--family openinference|otel|openllmetry] [--project-dir .]

Idempotent: the managed block in .env.example is replaced in place on re-run, and
.gitignore entries are only appended when missing. .gitignore is handled first, so .env is
ignored before it is touched. In .env it appends only the non-secret settings (traces endpoint,
service name, content-capture flags) that are not already defined, looking at variable names only.
It never writes the ingest key: the user adds OTEL_EXPORTER_OTLP_TRACES_HEADERS themselves, so a
real key cannot end up in a tracked file or pass through the assistant.
"""
import argparse
import re
from pathlib import Path

BEGIN = "# >>> agentscore-setup (managed block)"
END = "# <<< agentscore-setup"
IGNORE_ENTRIES = [".env", ".agentscore-spans.jsonl"]


def block(base_url: str, service_name: str, family: str) -> str:
    base = base_url.rstrip("/")
    lines = [
        BEGIN,
        "# Create an ingest key (tk_...) under Integrations in AgentScore.",
        "# Put the real value in .env (git-ignored), never in this file.",
        f"OTEL_EXPORTER_OTLP_TRACES_ENDPOINT={base}/external/otel/v1/traces",
        "OTEL_EXPORTER_OTLP_TRACES_HEADERS=Authorization=Bearer%20tk_REPLACE_ME",
        f"OTEL_SERVICE_NAME={service_name}",
    ]
    if family == "otel":
        lines += [
            "# The official OTel GenAI instrumentors omit prompts and responses unless this is set.",
            "OTEL_INSTRUMENTATION_GENAI_CAPTURE_MESSAGE_CONTENT=SPAN_ONLY",
            "OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental",
        ]
    lines.append(END)
    return "\n".join(lines) + "\n"


def upsert_block(path: Path, new_block: str) -> str:
    text = path.read_text() if path.exists() else ""
    pattern = re.compile(re.escape(BEGIN) + r".*?" + re.escape(END) + r"\n?", re.S)
    if pattern.search(text):
        updated = pattern.sub(lambda _: new_block, text)
        action = "unchanged" if updated == text else "updated"
    else:
        updated = text + ("" if not text or text.endswith("\n\n") else "\n" if text.endswith("\n") else "\n\n") + new_block
        action = "created" if not text else "appended"
    if updated != text:
        path.write_text(updated)
    return action


def settings(base_url: str, service_name: str, family: str) -> dict:
    """The non-secret variables the bootstrap reads."""
    out = {
        "OTEL_EXPORTER_OTLP_TRACES_ENDPOINT": f"{base_url.rstrip('/')}/external/otel/v1/traces",
        "OTEL_SERVICE_NAME": service_name,
    }
    if family == "otel":
        out["OTEL_INSTRUMENTATION_GENAI_CAPTURE_MESSAGE_CONTENT"] = "SPAN_ONLY"
        out["OTEL_SEMCONV_STABILITY_OPT_IN"] = "gen_ai_latest_experimental"
    return out


def fill_env(path: Path, wanted: dict) -> list:
    """Append wanted variables missing from .env; never overwrite one the user already set."""
    existing = path.read_text() if path.exists() else ""
    have = set(re.findall(r"^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=", existing, re.M))
    missing = {k: v for k, v in wanted.items() if k not in have}
    if missing:
        sep = "" if not existing or existing.endswith("\n") else "\n"
        path.write_text(existing + sep + "".join(f"{k}={v}\n" for k, v in missing.items()))
    return sorted(missing)


def ensure_gitignore(path: Path) -> list:
    existing = path.read_text() if path.exists() else ""
    present = {l.strip() for l in existing.splitlines()}
    missing = [e for e in IGNORE_ENTRIES if e not in present and f"/{e}" not in present]
    if missing:
        sep = "" if not existing or existing.endswith("\n") else "\n"
        path.write_text(existing + sep + "\n".join(missing) + "\n")
    return missing


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--base-url", required=True, help="ingest host, e.g. https://agent-score-ingest.product.tricentis.com")
    ap.add_argument("--service-name", required=True)
    ap.add_argument("--family", default="openinference", choices=["openinference", "otel", "openllmetry", "manual"])
    ap.add_argument("--project-dir", default=".")
    a = ap.parse_args()
    if "/v1/traces" in a.base_url:
        ap.error("--base-url must be the host only; the script appends /external/otel/v1/traces")
    root = Path(a.project_dir)
    added = ensure_gitignore(root / ".gitignore")  # first: .env must be ignored before it is written
    action = upsert_block(root / ".env.example", block(a.base_url, a.service_name, a.family))
    filled = fill_env(root / ".env", settings(a.base_url, a.service_name, a.family))
    print(f".gitignore: added {added}" if added else ".gitignore: already covers .env and the span file")
    print(f".env.example: {action}")
    print(f".env: added {filled}" if filled else ".env: non-secret settings already present")
    print("Next: the user adds OTEL_EXPORTER_OTLP_TRACES_HEADERS (the ingest key) to .env themselves.")


if __name__ == "__main__":
    main()

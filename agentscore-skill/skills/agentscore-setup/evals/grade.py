#!/usr/bin/env python3
"""Grade one finished setup run against its fixture.

Usage: uv run --with opentelemetry-proto --with protobuf python grade.py <run_dir> <fixture name>

<run_dir> holds project/ (the repo the agent worked in) and the files the run was told to write
(plan.md, report.md, idempotency.json). Writes <run_dir>/grading.json in the skill-creator schema
({"expectations": [{"text", "passed", "evidence"}]}).

Checks are outcome-first: the agent is run with the standard OTLP environment variables pointing at
a local capture server, and what was actually exported is decoded and inspected. Nothing depends on
a skill-specific convention except the marker, idempotency and report checks.
"""
import gzip
import json
import os
import re
import subprocess
import sys
import threading
import time
from http.server import BaseHTTPRequestHandler, HTTPServer
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / "scripts"))
import span_tree  # noqa: E402

FAKE_KEY = "tk_GRADERFAKEKEY0001"
STUB_PORT, CAPTURE_PORT = 9101, 9102
ENTRY = {"python-openai": ["agent.py"], "python-langgraph": ["main.py"], "node-vercel-ai": ["src/agent.ts"]}
RUN = {
    "python-openai": [".venv/bin/python", "agent.py"],
    "python-langgraph": [".venv/bin/python", "main.py"],
    "node-vercel-ai": ["npx", "tsx", "src/agent.ts"],
}
SKIP = {"node_modules", ".venv", ".git", "__pycache__", "dist"}


# ---------- OTLP capture ----------
class Capture(BaseHTTPRequestHandler):
    requests = []

    def log_message(self, *a):
        pass

    def do_POST(self):
        if self.headers.get("transfer-encoding", "").lower() == "chunked":
            body = b""
            while True:
                size = int(self.rfile.readline().strip() or b"0", 16)
                if size == 0:
                    self.rfile.readline()
                    break
                body += self.rfile.read(size)
                self.rfile.readline()
        else:
            body = self.rfile.read(int(self.headers.get("content-length", 0)))
        if self.headers.get("content-encoding") == "gzip":
            body = gzip.decompress(body)
        Capture.requests.append({"path": self.path, "auth": self.headers.get("authorization"), "body": body,
                                 "ctype": self.headers.get("content-type", "")})
        self.send_response(202)
        self.send_header("content-length", "0")
        self.end_headers()


def any_value(v):
    kind = v.WhichOneof("value")
    if kind is None:
        return None
    if kind == "array_value":
        return [any_value(x) for x in v.array_value.values]
    if kind == "kvlist_value":
        return {kv.key: any_value(kv.value) for kv in v.kvlist_value.values}
    return getattr(v, kind)


def decode_spans(requests):
    from opentelemetry.proto.collector.trace.v1.trace_service_pb2 import ExportTraceServiceRequest

    spans = []
    for r in requests:
        if "protobuf" not in r["ctype"]:
            continue  # the real ingest cannot parse these either
        msg = ExportTraceServiceRequest()
        msg.ParseFromString(r["body"])
        for rs in msg.resource_spans:
            res = {kv.key: any_value(kv.value) for kv in rs.resource.attributes}
            for ss in rs.scope_spans:
                for s in ss.spans:
                    spans.append({
                        "name": s.name, "trace": s.trace_id.hex(), "id": s.span_id.hex(),
                        "parent": s.parent_span_id.hex() or None,
                        "attrs": {kv.key: any_value(kv.value) for kv in s.attributes}, "res": res,
                    })
    return spans


def run_agent(project: Path, fixture: str):
    """Run the agent once with OTLP env pointing at the capture server. Returns (stdout, stderr, spans, requests)."""
    Capture.requests = []
    cap = HTTPServer(("127.0.0.1", CAPTURE_PORT), Capture)
    threading.Thread(target=cap.serve_forever, daemon=True).start()
    stub = subprocess.Popen([sys.executable, str(HERE / "fixtures" / "stub_openai_server.py"), str(STUB_PORT)])
    time.sleep(1)
    env = {k: v for k, v in os.environ.items() if not k.startswith(("OTEL_", "AGENTSCORE", "OPENAI"))}
    env.update({
        "OPENAI_BASE_URL": f"http://127.0.0.1:{STUB_PORT}/v1", "OPENAI_API_KEY": "stub",
        "OTEL_EXPORTER_OTLP_TRACES_ENDPOINT": f"http://127.0.0.1:{CAPTURE_PORT}/external/otel/v1/traces",
        "OTEL_EXPORTER_OTLP_TRACES_HEADERS": f"Authorization=Bearer%20{FAKE_KEY}",
    })
    try:
        p = subprocess.run(RUN[fixture], cwd=project, env=env, capture_output=True, text=True, timeout=120)
        time.sleep(1.5)
    finally:
        stub.terminate()
        cap.shutdown()
        cap.server_close()
    spans = decode_spans(Capture.requests) if Capture.requests else []
    return p.stdout, p.stderr, spans, list(Capture.requests)


# ---------- helpers ----------
def files(project: Path):
    for p in project.rglob("*"):
        if p.is_file() and not (set(p.relative_to(project).parts) & SKIP):
            yield p


def git(project, *args):
    return subprocess.run(["git", *args], cwd=project, capture_output=True, text=True).stdout


def bootstrap_precedes_third_party(project: Path, entry: str, stems: set):
    """True if the bootstrap import comes before any third-party import. Returns (ok, detail)."""
    text = (project / entry).read_text()
    seen = []
    if entry.endswith(".py"):
        for line in text.splitlines():
            m = re.match(r"\s*(?:import|from)\s+([A-Za-z_][\w.]*)", line)
            if not m:
                continue
            mod = m.group(1).split(".")[0]
            if mod in stems:
                return True, f"order before bootstrap: {seen}"
            if mod not in sys.stdlib_module_names and mod != "__future__":
                return False, f"third-party import {mod!r} comes before the bootstrap"
            seen.append(mod)
    else:
        for line in text.splitlines():
            m = re.match(r"""\s*import\s+(?:.*?\s+from\s+)?["']([^"']+)["']""", line)
            if not m:
                continue
            mod = m.group(1)
            if Path(mod).stem in stems:
                return True, f"order before bootstrap: {seen}"
            if not mod.startswith("node:"):
                return False, f"import {mod!r} comes before the bootstrap"
            seen.append(mod)
    return False, "bootstrap is not imported"


def grade(run_dir: Path, fixture: str):
    project = run_dir / "project"
    exp = []

    def add(text, passed, evidence):
        exp.append({"text": text, "passed": bool(passed), "evidence": evidence})

    marker_files = [str(p.relative_to(project)) for p in files(project) if p.suffix in (".py", ".ts", ".js", ".mjs")
                    and "agentscore-setup:v1" in p.read_text(errors="ignore")]
    add("Exactly one bootstrap file carries the agentscore-setup:v1 marker", len(marker_files) == 1, f"marker files: {marker_files}")

    entry = ENTRY[fixture][0]
    stems = {Path(m).stem for m in marker_files}
    ok, detail = bootstrap_precedes_third_party(project, entry, stems)
    add("Bootstrap is imported in the entrypoint before any third-party import", ok, detail)

    gi = (project / ".gitignore").read_text().splitlines() if (project / ".gitignore").exists() else []
    add(".env is git-ignored", any(l.strip() in (".env", "/.env", ".env*") for l in gi), f".gitignore: {gi}")

    ee = (project / ".env.example").read_text() if (project / ".env.example").exists() else ""
    real_keys = [str(p.relative_to(project)) for p in files(project) if re.search(r"\btk_(?!REPLACE_ME)[A-Za-z0-9]{8,}", p.read_text(errors="ignore"))]
    add(".env.example has the _TRACES_ endpoint ending /external/otel/v1/traces and only a placeholder key",
        re.search(r"^OTEL_EXPORTER_OTLP_TRACES_ENDPOINT=\S+/external/otel/v1/traces\s*$", ee, re.M) and "tk_" in ee and not real_keys,
        f".env.example present={bool(ee)}; files containing a non-placeholder tk_ value: {real_keys}")

    unsuffixed = [str(p.relative_to(project)) for p in files(project) if re.search(r"OTEL_EXPORTER_OTLP_ENDPOINT", p.read_text(errors="ignore"))]
    add("The unsuffixed OTEL_EXPORTER_OTLP_ENDPOINT is not used anywhere", not unsuffixed, f"found in: {unsuffixed}")

    manifest = ""
    for m in ("requirements.txt", "pyproject.toml", "package.json"):
        if (project / m).exists():
            manifest += (project / m).read_text()
    need = ["@opentelemetry/sdk-node", "@opentelemetry/exporter-trace-otlp-proto"] if fixture.startswith("node") else ["opentelemetry-sdk", "opentelemetry-exporter-otlp"]
    add("Dependency manifest declares the OpenTelemetry SDK and OTLP exporter", all(n in manifest for n in need),
        f"missing: {[n for n in need if n not in manifest]}")
    noise = [n for n in ("instrumentation-httpx", "instrumentation-requests", "instrumentation-fastapi", "instrumentation-http", "instrumentation-undici") if n in manifest]
    add("No HTTP/web-framework instrumentors added", not noise, f"found: {noise}")

    # outcome: run the agent and inspect what is exported
    stdout, stderr, spans, reqs = run_agent(project, fixture)
    add("Agent still runs and produces its answer", "shipped" in stdout, f"stdout: {stdout.strip()[:120]!r} stderr tail: {stderr.strip()[-200:]!r}")
    add("Export reaches /external/otel/v1/traces with the bearer key from the environment",
        bool(reqs) and all(r["path"] == "/external/otel/v1/traces" and r["auth"] == f"Bearer {FAKE_KEY}" for r in reqs),
        f"{len(reqs)} request(s): {[(r['path'], (r['auth'] or '')[:14]) for r in reqs][:3]}")
    add("Exporter sends a protobuf body (AgentScore's ingest rejects JSON with a 400)",
        bool(reqs) and all("protobuf" in r["ctype"] and len(r["body"]) > 0 for r in reqs),
        f"content types: {sorted({r['ctype'] for r in reqs})}, body sizes: {[len(r['body']) for r in reqs]}")
    traces = {s["trace"] for s in spans}
    add("One agent run exports as exactly one trace", len(traces) == 1, f"{len(spans)} spans in {len(traces)} trace(s)")
    if spans:
        results, _ = span_tree.check_trace(spans)
        bad = [f"{r['check']}: {r['detail']}" for r in results if r["status"] == "fail"]
        add("Exported trace passes every span_tree check (root, model, prompt text, tool spans, accepted operation names, identity)",
            not bad, "all checks pass" if not bad else "; ".join(bad))
        add("No ingest key appears in exported span data", not any(FAKE_KEY in json.dumps(s["attrs"], default=str) for s in spans), "")
    else:
        add("Exported trace passes every span_tree check (root, model, prompt text, tool spans, accepted operation names, identity)", False, "nothing was exported")

    # process checks
    plan, boot = run_dir / "plan.md", [project / m for m in marker_files]
    changed_mtimes = [p.stat().st_mtime for p in boot if p.exists()]
    add("plan.md was written before the first project file was changed",
        plan.exists() and bool(changed_mtimes) and plan.stat().st_mtime < min(changed_mtimes),
        f"plan exists={plan.exists()}, plan mtime={plan.stat().st_mtime if plan.exists() else None}, bootstrap mtimes={changed_mtimes}")
    idem = run_dir / "idempotency.json"
    changed = json.loads(idem.read_text()).get("changed") if idem.exists() else None
    add("A second pass of the skill changes no project files", idem.exists() and changed == [], f"idempotency.json changed={changed}")
    report = (run_dir / "report.md").read_text() if (run_dir / "report.md").exists() else ""
    add("Report tells the user how to add the key themselves and mentions the ~20 trace threshold",
        bool(report) and re.search(r"stty|read -s|\.env", report) and re.search(r"\b20\b", report) and not re.search(r"tk_[A-Za-z0-9]{12,}", report),
        f"report chars={len(report)}")

    # per-fixture checks
    if fixture == "python-langgraph":
        diff = git(project, "diff", "--numstat", "HEAD", "--", "main.py").split()
        added = int(diff[0]) if diff else 0
        add("Framework agent code is changed by at most the bootstrap import (LangGraph traces itself)",
            added <= 3 and "tracer" not in (project / "main.py").read_text(), f"lines added to main.py: {added}")
    if fixture == "python-openai":
        src = (project / "agent.py").read_text()
        add("Hand-written agent and tool spans added around the plain-SDK loop and tool dispatch",
            "invoke_agent" in src and "execute_tool" in src, "invoke_agent/execute_tool present in agent.py")
    if fixture == "node-vercel-ai":
        pkg = (project / "package.json").read_text()
        src = (project / "src/agent.ts").read_text()
        add("Vercel AI SDK telemetry is enabled and the OpenInference processor is installed",
            "@arizeai/openinference-vercel" in pkg and "experimental_telemetry" in src, "package.json + agent.ts checked")

    return exp


def main():
    run_dir, fixture = Path(sys.argv[1]).resolve(), sys.argv[2]
    exp = grade(run_dir, fixture)
    passed = sum(e["passed"] for e in exp)
    (run_dir / "grading.json").write_text(json.dumps({
        "expectations": exp,
        "summary": {"passed": passed, "failed": len(exp) - passed, "total": len(exp), "pass_rate": round(passed / len(exp), 3)},
    }, indent=2))
    for e in exp:
        print(("PASS " if e["passed"] else "FAIL ") + e["text"] + ("" if e["passed"] else f"\n       {e['evidence']}"))
    print(f"\n{passed}/{len(exp)} passed")


if __name__ == "__main__":
    main()

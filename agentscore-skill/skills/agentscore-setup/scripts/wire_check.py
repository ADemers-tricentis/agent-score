#!/usr/bin/env python3
"""Run the agent against a local OTLP receiver and check the export the way AgentScore's ingest sees it.

Usage: python wire_check.py -- <the agent's normal run command>
   e.g. python wire_check.py -- .venv/bin/python agent.py "Where is order A100?"

The command runs with the standard _TRACES_ environment variables pointed at a local server and a
made-up key, so it needs no AgentScore credentials and sends nothing off the machine. This exercises the
real exporter (protocol, headers, env-var parsing), which console mode does not. Checks:
  - the request path is /external/otel/v1/traces
  - Authorization is "Bearer tk_..." exactly as supplied through the environment
  - the body is protobuf (AgentScore's ingest rejects JSON with a 400) and not empty
  - at least one request arrived before the process ended
Exit code 0 = all pass. Stdlib only. The command's own output is shown after the report.
"""
import os
import subprocess
import sys
import threading
import time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

FAKE_KEY = "tk_WIRECHECK0000000"
requests = []


def read_body(h):
    if h.headers.get("transfer-encoding", "").lower() == "chunked":
        body = b""
        while True:
            size = int(h.rfile.readline().strip() or b"0", 16)
            if size == 0:
                h.rfile.readline()
                return body
            body += h.rfile.read(size)
            h.rfile.readline()
    return h.rfile.read(int(h.headers.get("content-length", 0)))


class Handler(BaseHTTPRequestHandler):
    def log_message(self, *a):
        pass

    def do_POST(self):
        body = read_body(self)
        requests.append({"path": self.path, "auth": self.headers.get("authorization"),
                         "ctype": self.headers.get("content-type", ""), "gzip": self.headers.get("content-encoding") == "gzip",
                         "bytes": len(body)})
        self.send_response(202)
        self.send_header("content-length", "0")
        self.end_headers()


def main():
    if "--" not in sys.argv or sys.argv.index("--") == len(sys.argv) - 1:
        sys.exit(__doc__)
    cmd = sys.argv[sys.argv.index("--") + 1:]
    server = ThreadingHTTPServer(("127.0.0.1", 0), Handler)
    threading.Thread(target=server.serve_forever, daemon=True).start()
    env = dict(os.environ)
    for k in list(env):
        if k.startswith("OTEL_EXPORTER") or k in ("AGENTSCORE_EXPORTER",):
            del env[k]
    env["OTEL_EXPORTER_OTLP_TRACES_ENDPOINT"] = f"http://127.0.0.1:{server.server_port}/external/otel/v1/traces"
    env["OTEL_EXPORTER_OTLP_TRACES_HEADERS"] = f"Authorization=Bearer%20{FAKE_KEY}"
    proc = subprocess.run(cmd, env=env, capture_output=True, text=True)
    time.sleep(1.5)  # let a batch exporter finish its last send
    server.shutdown()

    checks = [
        ("agent command exited 0", proc.returncode == 0, f"exit {proc.returncode}"),
        ("at least one export request arrived", bool(requests), f"{len(requests)} request(s); if 0, the bootstrap is not imported first, or the exporter ignores the _TRACES_ env vars"),
        ("path is /external/otel/v1/traces", bool(requests) and all(r["path"] == "/external/otel/v1/traces" for r in requests), str({r["path"] for r in requests})),
        ("Authorization header is the bearer key from the environment", bool(requests) and all(r["auth"] == f"Bearer {FAKE_KEY}" for r in requests), "the header must come from OTEL_EXPORTER_OTLP_TRACES_HEADERS, not be hard-coded"),
        ("body is protobuf, not JSON", bool(requests) and all("protobuf" in r["ctype"] for r in requests), str({r["ctype"] for r in requests}) + " (Node: use exporter-trace-otlp-proto)"),
        ("body is not empty", bool(requests) and all(r["bytes"] > 0 for r in requests), str([r["bytes"] for r in requests])),
    ]
    for name, ok, detail in checks:
        print(("PASS " if ok else "FAIL ") + name + ("" if ok else f" - {detail}"))
    print("\n--- agent output ---\n" + proc.stdout.strip()[-800:] + ("\n--- stderr ---\n" + proc.stderr.strip()[-800:] if proc.stderr.strip() else ""))
    sys.exit(0 if all(ok for _, ok, _ in checks) else 1)


if __name__ == "__main__":
    main()

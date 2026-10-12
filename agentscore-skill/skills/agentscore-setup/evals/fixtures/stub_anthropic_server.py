"""Stub Anthropic Messages server for offline evals.

Usage: python stub_anthropic_server.py PORT
Point an agent at it with ANTHROPIC_BASE_URL=http://127.0.0.1:PORT and any ANTHROPIC_API_KEY.
When the request offers tools and has no tool_result yet, it answers with a tool_use for the
first offered tool; otherwise it answers with plain text. Serves /v1/messages.
"""
import json, sys
from http.server import BaseHTTPRequestHandler, HTTPServer

def _args(tool):
    props = (tool.get("input_schema") or {}).get("properties") or {}
    return {k: ("A100" if v.get("type", "string") == "string" else 1) for k, v in props.items()}


def _has_tool_result(msgs):
    return any(isinstance(m.get("content"), list) and any(b.get("type") == "tool_result" for b in m["content"])
               for m in msgs)


class H(BaseHTTPRequestHandler):
    def log_message(self, *a): pass
    def do_POST(self):
        n = int(self.headers.get("content-length", 0)); body = json.loads(self.rfile.read(n) or b"{}")
        if body.get("tools") and not _has_tool_result(body.get("messages", [])):
            content = [{"type": "tool_use", "id": "toolu_1", "name": body["tools"][0]["name"], "input": _args(body["tools"][0])}]
            stop = "tool_use"
        else:
            content = [{"type": "text", "text": "Order A100 shipped yesterday and arrives Friday."}]; stop = "end_turn"
        out = {"id": "msg_1", "type": "message", "role": "assistant", "model": body.get("model", "claude-haiku-4-5"),
               "content": content, "stop_reason": stop, "stop_sequence": None,
               "usage": {"input_tokens": 21, "output_tokens": 9}}
        b = json.dumps(out).encode(); self.send_response(200); self.send_header("content-type", "application/json")
        self.send_header("content-length", str(len(b))); self.end_headers(); self.wfile.write(b)

HTTPServer(("127.0.0.1", int(sys.argv[1])), H).serve_forever()

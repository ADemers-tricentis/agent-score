"""Stub OpenAI-compatible server for offline evals.

Usage: python stub_openai_server.py PORT
Point an agent at it with OPENAI_BASE_URL=http://127.0.0.1:PORT/v1 and any OPENAI_API_KEY.
When the request offers tools and has no tool result yet, it answers with a call to the
first offered tool; otherwise it answers with plain text. Serves /v1/chat/completions.
"""
import json, sys
from http.server import BaseHTTPRequestHandler, HTTPServer

def _args(tool):
    props = (tool["function"].get("parameters") or {}).get("properties") or {}
    return {k: ("A100" if v.get("type", "string") == "string" else 1) for k, v in props.items()}


class H(BaseHTTPRequestHandler):
    def log_message(self, *a): pass
    def do_POST(self):
        n = int(self.headers.get("content-length", 0)); body = json.loads(self.rfile.read(n) or b"{}")
        msgs = body.get("messages", [])
        has_tool_result = any(m.get("role") == "tool" for m in msgs)
        if body.get("tools") and not has_tool_result:
            msg = {"role": "assistant", "content": None, "tool_calls": [{"id": "call_1", "type": "function",
                   "function": {"name": body["tools"][0]["function"]["name"], "arguments": json.dumps(_args(body["tools"][0]))}}]}
            fr = "tool_calls"
        else:
            msg = {"role": "assistant", "content": "Order A100 shipped yesterday and arrives Friday."}; fr = "stop"
        out = {"id": "chatcmpl-1", "object": "chat.completion", "created": 1, "model": body.get("model", "gpt-4o-mini"),
               "choices": [{"index": 0, "message": msg, "finish_reason": fr}],
               "usage": {"prompt_tokens": 21, "completion_tokens": 9, "total_tokens": 30}}
        b = json.dumps(out).encode(); self.send_response(200); self.send_header("content-type", "application/json")
        self.send_header("content-length", str(len(b))); self.end_headers(); self.wfile.write(b)

HTTPServer(("127.0.0.1", int(sys.argv[1])), H).serve_forever()

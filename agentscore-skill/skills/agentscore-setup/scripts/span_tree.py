#!/usr/bin/env python3
"""Print the span tree from a JSONL span file and check it against what AgentScore scores on.

Usage: python span_tree.py [.agentscore-spans.jsonl] [--json]

Input is the file the bootstrap writes in console mode (one span per line, the shape of
OpenTelemetry's `ReadableSpan.to_json`). Exit code 0 = every trace passes, 1 = a check failed.
Checks mirror how AgentScore reads spans; see references/attributes.md.
"""
import json
import re
import sys
from collections import defaultdict

OPERATIONS_OK = {"chat", "completion", "text_completion", "generate_content", "generate",
                 "embeddings", "invoke_agent", "create_agent", "execute_tool"}
OI_KINDS = {"AGENT", "LLM", "TOOL", "CHAIN", "RETRIEVER", "RERANKER", "EMBEDDING", "GUARDRAIL", "EVALUATOR", "PROMPT"}
LF_TYPES = {"span", "generation", "event", "embedding", "agent", "tool", "chain"}
INFRA_PREFIX = ("GET ", "POST ", "PUT ", "DELETE ", "HTTP ", "redis", "SELECT ", "INSERT ")
KEY_RE = re.compile(r"\btk_[A-Za-z0-9_\-]{8,}")
IDENTITY_KEYS = ("gen_ai.agent.name", "agent.name", "gen_ai.agent.id", "agent.id", "gen_ai.system_instructions",
                 "traceloop.workflow.name", "traceloop.entity.name", "graph.node.name", "crewai.agent.role")


def kind(attrs: dict, name: str) -> str:
    """Role of a span, using the same priority AgentScore does."""
    lf = str(attrs.get("langfuse.observation.type", "")).lower()
    if lf in LF_TYPES:
        return {"generation": "LLM", "span": "SPAN", "event": "SPAN"}.get(lf, lf.upper())
    oi = str(attrs.get("openinference.span.kind", "")).upper()
    if oi in OI_KINDS:
        return {"EMBEDDING": "LLM", "RERANKER": "RETRIEVER"}.get(oi, oi)
    op = str(attrs.get("gen_ai.operation.name", "")).lower()
    if op:
        return {"invoke_agent": "AGENT", "create_agent": "AGENT", "execute_tool": "TOOL"}.get(op, "LLM" if op in OPERATIONS_OK else "BAD_OP")
    if "tool.name" in attrs or any(k.startswith("tais.tool.") for k in attrs):
        return "TOOL"
    if "gen_ai.request.model" in attrs or "llm.model_name" in attrs or "gen_ai.input.messages" in attrs:
        return "LLM"
    return "SPAN"


def has_any(attrs, *prefixes):
    return any(k == p or k.startswith(p + ".") or k.startswith(p) and p.endswith(".") for k in attrs for p in prefixes)


def load(path):
    spans = []
    for line in open(path):
        line = line.strip()
        if line.startswith("{"):
            d = json.loads(line)
            ctx = d.get("context") or {}
            spans.append({
                "name": d.get("name", "?"), "trace": ctx.get("trace_id"), "id": ctx.get("span_id"),
                "parent": d.get("parent_id"), "attrs": d.get("attributes") or {},
                "res": (d.get("resource") or {}).get("attributes") or {},
            })
    return spans


def check_trace(spans):
    by_id = {s["id"]: s for s in spans}
    for s in spans:
        s["kind"] = kind(s["attrs"], s["name"])
    roots = [s for s in spans if not s["parent"] or s["parent"] not in by_id]
    llms = [s for s in spans if s["kind"] == "LLM"]
    tools = [s for s in spans if s["kind"] == "TOOL"]
    results = []

    def add(name, status, detail=""):
        results.append({"check": name, "status": status, "detail": detail})

    add("root span", "pass" if len([r for r in roots if not r["parent"]]) == 1 else ("warn" if roots else "fail"),
        f"{len(roots)} span(s) without a parent in this trace" if len(roots) != 1 else roots[0]["name"])
    bad_ops = sorted({s["attrs"]["gen_ai.operation.name"] for s in spans if s["kind"] == "BAD_OP"})
    add("gen_ai.operation.name values are accepted", "fail" if bad_ops else "pass",
        f"unrecognized {bad_ops}: AgentScore rejects the whole trace" if bad_ops else "")
    add("LLM spans present", "pass" if llms else "fail", f"{len(llms)} LLM span(s)")
    if llms:
        no_model = [s["name"] for s in llms if not (s["attrs"].get("gen_ai.request.model") or s["attrs"].get("llm.model_name") or s["attrs"].get("gen_ai.response.model"))]
        add("LLM spans name their model", "fail" if no_model else "pass", ", ".join(no_model[:3]))
        tok = lambda a: ("gen_ai.usage.input_tokens" in a or "llm.token_count.prompt" in a or "gen_ai.usage.prompt_tokens" in a or "llm.input_tokens" in a)
        add("LLM spans report token usage", "pass" if all(tok(s["attrs"]) for s in llms) else "warn",
            "" if all(tok(s["attrs"]) for s in llms) else "cost and efficiency views will be empty")
        has_io = lambda a: any(k in a for k in ("input.value", "gen_ai.input.messages", "traceloop.entity.input")) or any(k.startswith("llm.input_messages") for k in a)
        add("LLM spans carry prompt content", "pass" if all(has_io(s["attrs"]) for s in llms) else "fail",
            "" if all(has_io(s["attrs"]) for s in llms) else "prompts/responses are missing; see references/instrumentors.md")
    tool_calls_seen = any("tool_call" in k or "tool.calls" in k or "tool_calls" in k for s in llms for k in s["attrs"])
    if tools:
        unnamed = [s for s in tools if s["name"] in ("", "?") and "tool.name" not in s["attrs"] and "gen_ai.tool.name" not in s["attrs"]]
        add("tool spans present and named", "fail" if unnamed else "pass", f"{len(tools)} tool span(s)")
    else:
        add("tool spans present", "fail" if tool_calls_seen else "warn",
            "the model requested tool calls but no tool span exists: trace the tool dispatch" if tool_calls_seen
            else "no tool use in this trace; fine if the agent has no tools")
    ident = any(k in s["attrs"] for s in spans for k in IDENTITY_KEYS) or bool(tools) or any(s["res"].get("service.name") not in (None, "", "unknown_service") for s in spans)
    add("agent identity signal", "pass" if ident else "fail", "name, tools, system prompt or service.name")
    noise = [s for s in spans if s["name"].startswith(INFRA_PREFIX) or "http.method" in s["attrs"] or "http.request.method" in s["attrs"]]
    add("no HTTP/DB noise spans", "warn" if noise else "pass", f"{len(noise)} infra span(s); AgentScore drops them, remove the HTTP instrumentor" if noise else "")
    leaked = [s["name"] for s in spans if any(KEY_RE.search(str(v)) for v in list(s["attrs"].values()) + list(s["res"].values()))]
    add("no ingest key in span data", "fail" if leaked else "pass", f"found in: {leaked[:3]}" if leaked else "")
    return results, roots


def render(spans, roots):
    children = defaultdict(list)
    ids = {s["id"] for s in spans}
    for s in spans:
        if s["parent"] in ids:
            children[s["parent"]].append(s)
    lines = []

    def walk(s, depth):
        extra = s["attrs"].get("gen_ai.request.model") or s["attrs"].get("llm.model_name") or s["attrs"].get("tool.name") or s["attrs"].get("gen_ai.tool.name") or ""
        lines.append(f"{'  ' * depth}{s['kind']:<9} {s['name']}" + (f"  [{extra}]" if extra else ""))
        for c in children[s["id"]]:
            walk(c, depth + 1)

    for r in roots:
        walk(r, 0)
    return "\n".join(lines)


def main():
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    path = args[0] if args else ".agentscore-spans.jsonl"
    try:
        spans = load(path)
    except FileNotFoundError:
        sys.exit(f"{path} not found: run the agent with AGENTSCORE_EXPORTER=console first")
    if not spans:
        sys.exit(f"{path} has no spans: the bootstrap was not imported before the agent ran, or no LLM call happened")
    traces = defaultdict(list)
    for s in spans:
        traces[s["trace"]].append(s)
    failed, report = False, []
    for tid, ts in traces.items():
        results, roots = check_trace(ts)
        failed |= any(r["status"] == "fail" for r in results)
        report.append({"trace_id": tid, "spans": len(ts), "checks": results, "tree": render(ts, roots)})
    if "--json" in sys.argv:
        json.dump({"traces": report, "passed": not failed}, sys.stdout, indent=2)
        print()
    else:
        for t in report:
            print(f"\nTrace {t['trace_id']}  ({t['spans']} spans)\n{t['tree']}\n")
            for r in t["checks"]:
                mark = {"pass": "PASS", "warn": "WARN", "fail": "FAIL"}[r["status"]]
                print(f"  [{mark}] {r['check']}" + (f" - {r['detail']}" if r["detail"] else ""))
        print("\nRESULT:", "FAILED" if failed else "passed")
    sys.exit(1 if failed else 0)


if __name__ == "__main__":
    main()

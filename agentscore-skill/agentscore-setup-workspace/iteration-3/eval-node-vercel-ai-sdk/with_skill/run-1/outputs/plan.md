# Plan: connect order-support-agent to AgentScore

Detected: TypeScript, ESM, npm, Vercel AI SDK (ai 5.0.x), OpenAI provider, entrypoint src/agent.ts, no existing telemetry, no .env/.gitignore.
Ingest base URL (from user): https://agent-score-ingest.product.tricentis.com. No ingest key exists; placeholder only, user adds it later.

Instrumentation: ai v5 -> @arizeai/openinference-vercel@^2 span processor (swap `wrap` in bootstrap), plus experimental_telemetry on the one generateText call. Tools/agent spans come from the framework; no manual spans.

Dependencies to add: @opentelemetry/sdk-node, @opentelemetry/exporter-trace-otlp-proto, @opentelemetry/sdk-trace-base, @opentelemetry/core, @opentelemetry/api, @arizeai/openinference-vercel@^2 (npm install).

Files:
- .gitignore, .env.example, .env (non-secret): via configure_env.py
- src/agentscore-otel.ts: bootstrap from template (service name order-support-agent)
- src/agent.ts: first import line + experimental_telemetry on generateText
- package.json / package-lock.json: deps

Verification: console-mode run against stub OpenAI server, span_tree.py, wire_check.py (local receiver, fake key). No real send (no key). Delete .agentscore-spans.jsonl afterwards.
Second pass: re-run flow; expect no changes.

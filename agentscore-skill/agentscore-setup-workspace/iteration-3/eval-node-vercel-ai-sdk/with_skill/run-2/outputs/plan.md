# Plan: AgentScore setup for order-support-agent

Detected: Node/TypeScript, npm, ESM (NodeNext), Vercel AI SDK `ai` 5.0.x (v5 path), OpenAI provider, entrypoint src/agent.ts. No existing telemetry. Not set up yet.
Ingest URL (user supplied): https://agent-score-ingest.product.tricentis.com. No ingest key exists; only `tk_REPLACE_ME` placeholder goes in .env.example. The user adds a key later.

Instrumentation: `@arizeai/openinference-vercel@^2` span processor (ai v5), swapped into the bootstrap `wrap()`. Needs `experimental_telemetry: { isEnabled: true, functionId }` on the one generateText call. Framework traces agent/LLM/tool spans, so no manual spans unless span_tree.py shows a gap.

Dependencies (npm install): @opentelemetry/sdk-node, @opentelemetry/exporter-trace-otlp-proto, @opentelemetry/sdk-trace-base, @opentelemetry/core, @opentelemetry/api, @arizeai/openinference-vercel@^2.

Files:
- src/agentscore-otel.ts (new, from template, service name order-support-agent, wrap swapped)
- src/agent.ts: first import `./agentscore-otel.js` + experimental_telemetry on generateText
- package.json / package-lock.json (deps)
- .env.example, .env (non-secret only), .gitignore via configure_env.py

Verification: run with AGENTSCORE_EXPORTER=console against local stub OpenAI server (fake OPENAI_API_KEY, OPENAI_BASE_URL=localhost), span_tree.py, wire_check.py (local receiver, made-up key). No real sends; no real key.
Idempotency: second pass per Re-runs section.

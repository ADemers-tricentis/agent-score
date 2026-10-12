# Plan: connect order-support-agent to AgentScore

Detected: Node/TypeScript (ESM, NodeNext), npm, Vercel AI SDK (`ai` ^5, installed 5.0.272), @ai-sdk/openai, entrypoint src/agent.ts. No existing telemetry. Not yet set up.

Connection: ingest base URL https://agent-score-ingest.product.tricentis.com (given). No ingest key exists; only placeholder `tk_REPLACE_ME` in .env.example. User adds the real key later themselves.

Instrumentation: OpenInference span processor `@arizeai/openinference-vercel@^2` (ai v5 path, no @ai-sdk/otel). Framework traces its own agent/LLM/tool spans, so no manual spans. Requires `experimental_telemetry: { isEnabled: true, functionId: "order-support-agent" }` on the one generateText call in src/agent.ts.

Dependencies to add: @opentelemetry/sdk-node, @opentelemetry/exporter-trace-otlp-proto, @opentelemetry/sdk-trace-base, @opentelemetry/core, @opentelemetry/api, @arizeai/openinference-vercel@^2.

Files:
- configure_env.py: .gitignore (covers .env), .env.example (placeholders), .env (non-secret endpoint + service name)
- package.json / package-lock.json: deps
- src/agentscore-otel.ts: new bootstrap (service name order-support-agent, OpenInference processors in wrap())
- src/agent.ts: one import line first, `import "./agentscore-otel.js";`, plus experimental_telemetry on generateText

Verification: run with AGENTSCORE_EXPORTER=console against the local stub OpenAI server (OPENAI_BASE_URL, dummy OPENAI_API_KEY), span_tree.py, then wire_check.py (local receiver, fake key). No real send to the ingest URL (no key). Delete .agentscore-spans.jsonl afterwards.

Then idempotency re-run (Re-runs section).

Note: this is a non-interactive eval; the task protocol stands in for the step-3 confirmation.

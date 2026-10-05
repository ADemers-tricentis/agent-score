# AgentScore setup report - order-support-agent (Vercel AI SDK, TypeScript)

Changes in project/:
- npm added @opentelemetry/api, sdk-node, sdk-trace-base, exporter-trace-otlp-http, resources.
- src/instrumentation.ts (new): OTel NodeSDK, OTLP/HTTP exporter to https://agent-score-ingest.product.tricentis.com/v1/traces, Bearer key from AGENTSCORE_INGEST_KEY (env only). Optional AGENTSCORE_LOCAL_SPANS=1 writes spans to .agentscore-spans.jsonl.
- src/agent.ts: imports instrumentation first, enables experimental_telemetry on generateText, flushes on exit.
- .gitignore, .env.example added.

Verified locally against the stub OpenAI server: agent runs, 4 spans in one trace (ai.generateText, 2x doGenerate, ai.toolCall) with functionId order-support-agent. Nothing was sent to the network. Stub stopped. Nothing committed.

Assumptions to confirm (not verifiable without a key/docs): the /v1/traces path and the "Authorization: Bearer" header for the ingest endpoint.

Next steps for you: create an ingest key in AgentScore, set AGENTSCORE_INGEST_KEY in your environment, run the agent, and confirm the trace appears. If auth/path differ, adjust src/instrumentation.ts.

Idempotency: second pass produced no file changes (see idempotency.json).

# Plan: send agent traces to AgentScore

Agent: Vercel AI SDK v5 (`ai`), TypeScript, npm, `src/agent.ts`.
Approach: the AI SDK emits OpenTelemetry spans when `experimental_telemetry.isEnabled` is true. Register an OTel NodeSDK with an OTLP/HTTP exporter pointed at the AgentScore ingest URL.

1. `npm install @opentelemetry/api @opentelemetry/sdk-node @opentelemetry/sdk-trace-base @opentelemetry/exporter-trace-otlp-http @opentelemetry/resources`
2. Add `src/instrumentation.ts`: starts NodeSDK, OTLP exporter to `${AGENTSCORE_INGEST_URL}/v1/traces` (default https://agent-score-ingest.product.tricentis.com), key read from `AGENTSCORE_INGEST_KEY` env (never hardcoded), service.name `order-support-agent`. If no key is set, nothing is sent over the network. Optional `AGENTSCORE_LOCAL_SPANS=1` writes spans to `.agentscore-spans.jsonl` for local verification.
3. Edit `src/agent.ts`: import `./instrumentation.js` first, pass `experimental_telemetry: { isEnabled: true, functionId: "order-support-agent" }` to `generateText`, flush/shutdown before exit.
4. Add `.gitignore` entries (`.env`, `.agentscore-spans.jsonl`, node_modules) and a `.env.example` documenting the variables.
5. Verify locally with the stub OpenAI server (no real sending), then stop the stub.
6. Tell the user to create an ingest key and set `AGENTSCORE_INGEST_KEY`.

# AgentScore setup plan

**Detected:** Node/TypeScript (ESM, NodeNext), npm, Vercel AI SDK (`ai` ^5, `@ai-sdk/openai`), entrypoint `src/agent.ts`. No existing telemetry.
Ingest base URL: https://agent-score-ingest.product.tricentis.com (default, confirmed). No ingest key yet.

**Instrumentation:** `@arizeai/openinference-vercel@^2` span processor (needed for `ai` v4-v6 so AgentScore reads prompts and tool spans). The Vercel AI SDK traces its own agent/step/tool structure, so no hand-written spans. `ai` v5 only emits spans when the call opts in, so one change to user code: add `experimental_telemetry: { isEnabled: true, functionId: "order-support-agent" }` to the single `generateText` call in `src/agent.ts` (in `run`).

**Dependencies to add (npm install):**
`@opentelemetry/sdk-node @opentelemetry/exporter-trace-otlp-proto @opentelemetry/sdk-trace-base @opentelemetry/core @opentelemetry/api @arizeai/openinference-vercel@^2`
(proto exporter, never the JSON -http one.)

**Files:**
- `src/agentscore-otel.ts` (new): bootstrap from the template, service name `order-support-agent`, `wrap()` swapped to OpenInference processors.
- `src/agent.ts`: add `import "./agentscore-otel.js";` as first import; add `experimental_telemetry` to `generateText`.
- `.gitignore` (new/updated): cover `.env`, `.agentscore-spans.jsonl`.
- `.env.example`: placeholders only (`tk_REPLACE_ME`).
- `.env`: non-secret endpoint + service name only; the user adds the key.
- `package.json` / `package-lock.json`: new deps.

**What will run:** one local run in console mode against a local stub OpenAI server, `span_tree.py`, and `wire_check.py` (local receiver, made-up key). No real traces are sent; the user must create a key first.

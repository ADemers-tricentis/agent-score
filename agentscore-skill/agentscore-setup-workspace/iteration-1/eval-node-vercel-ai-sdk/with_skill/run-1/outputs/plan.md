# AgentScore setup plan: order-support-agent

**Detected:** TypeScript (ESM, NodeNext), npm, Vercel AI SDK (`ai` 5.0.271) with `@ai-sdk/openai`, entrypoint `src/agent.ts`. No existing telemetry.

**Connection:** ingest base URL `https://agent-score-ingest.product.tricentis.com` (traces URL `.../external/otel/v1/traces`). No ingest key yet: create one under **Integrations** in AgentScore. You add it yourself later; I never see or write it.

**Instrumentation:** `ai` v5 means `@arizeai/openinference-vercel@^2` as a span processor (it rewrites the `ai.*` spans into agent/LLM/tool spans AgentScore reads). No separate SDK instrumentor and no hand-written spans; the framework emits agent, step and tool spans. One user-code change is required: v5 only emits spans when the call opts in, so `experimental_telemetry: { isEnabled: true, functionId: "order-support-agent" }` is added to the single `generateText` call in `src/agent.ts` (in `run`).

**Dependencies to add (npm install):**
`@opentelemetry/sdk-node @opentelemetry/exporter-trace-otlp-http @opentelemetry/sdk-trace-base @opentelemetry/core @opentelemetry/api @arizeai/openinference-vercel@^2`

**Files:**
- `src/agentscore-otel.ts` (new): bootstrap, service name `order-support-agent`, OpenInference processor swapped into `wrap`.
- `src/agent.ts`: add `import "./agentscore-otel.js";` as the first import, plus the `experimental_telemetry` option on `generateText`.
- `package.json` / `package-lock.json`: new dependencies.
- `.env.example` (new): placeholders only (`tk_REPLACE_ME`).
- `.gitignore` (new): `.env`, `.agentscore-spans.jsonl`.

**What runs:** one local run with `AGENTSCORE_EXPORTER=console` against a local stub OpenAI server, then `span_tree.py` check. Nothing is sent to AgentScore. Afterwards you add the key with the hidden-input `!` command and I ask before sending a real trace.

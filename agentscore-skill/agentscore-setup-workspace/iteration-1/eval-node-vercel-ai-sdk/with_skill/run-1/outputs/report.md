# AgentScore setup report: order-support-agent

**Detected:** TypeScript, ESM, npm, Vercel AI SDK (`ai` 5.0.271), `@ai-sdk/openai`, entrypoint `src/agent.ts`, no prior telemetry.

**Instrumentation:** `@arizeai/openinference-vercel@^2` span processor (the `ai` v5 path). No hand-written spans.

**Files created:** `src/agentscore-otel.ts`, `.env.example` (placeholders only), `.gitignore` (`.env`, `.agentscore-spans.jsonl`).
**Files changed:** `src/agent.ts` (first-line import `./agentscore-otel.js`; `experimental_telemetry: { isEnabled: true, functionId: "order-support-agent" }` on the one `generateText` call), `package.json`, `package-lock.json`.
**Dependencies added:** `@arizeai/openinference-vercel ^2.8.1`, `@opentelemetry/api`, `core`, `exporter-trace-otlp-http`, `sdk-node`, `sdk-trace-base`.

**Verification (ran, console mode, local stub OpenAI server):** `tsc --noEmit` clean; `span_tree.py` PASS on all checks. One trace: AGENT `ai.generateText`, 2 LLM spans, 1 TOOL span (`lookup_order`). No WARN lines. Nothing was sent to AgentScore; `.agentscore-spans.jsonl` deleted; stub stopped.

**Idempotency:** second pass (detect reported `already_set_up`, configure_env unchanged, npm install no-op, re-verification passed): no project file hashes changed (`idempotency.json` = `{"changed": []}`).

**Next steps for the user:**
1. In AgentScore, open **Integrations** and create an ingest key (`tk_...`).
2. Add it yourself, from the project dir, with hidden input: `! printf 'AgentScore ingest key (tk_...): '; stty -echo; read k; stty echo; echo; printf 'OTEL_EXPORTER_OTLP_TRACES_HEADERS=Authorization=Bearer%%20%s\n' "$k" >> .env; unset k`
3. Copy the three `OTEL_*` lines from `.env.example` into `.env` (endpoint and service name; the endpoint is `https://agent-score-ingest.product.tricentis.com/external/otel/v1/traces`), then run `npx tsx src/agent.ts` without `AGENTSCORE_EXPORTER` (not done yet; needs the key and your go-ahead).
4. In AgentScore open **Agents**: it shows "Setting up", then "Learning your agent" (n of 20 traces). Scoring begins after about 20 traces, so send realistic traffic including failures.

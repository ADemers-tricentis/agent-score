# AgentScore setup report

**Detected:** Node/TypeScript, ESM, npm, Vercel AI SDK (`ai` ^5), `@ai-sdk/openai`, entrypoint `src/agent.ts`, no prior telemetry.

**Changed/created (in project/):**
- `src/agentscore-otel.ts` (new): bootstrap, service name `order-support-agent`, OpenInference Vercel span processors, proto exporter.
- `src/agent.ts`: first import `./agentscore-otel.js`; `experimental_telemetry: { isEnabled: true, functionId: "order-support-agent" }` on the one `generateText` call (required for `ai` v5).
- `package.json`, `package-lock.json`: added `@arizeai/openinference-vercel@^2.8.1`, `@opentelemetry/{api,core,sdk-node,sdk-trace-base,exporter-trace-otlp-proto}`.
- `.gitignore` (.env, .agentscore-spans.jsonl), `.env.example` (placeholder key only), `.env` (endpoint + service name; no key).

**Verification (ran, against local stub OpenAI):** `span_tree.py` passed all checks (1 trace: AGENT root, 2 LLM spans, 1 TOOL span lookup_order). `wire_check.py` passed (path /external/otel/v1/traces, bearer from env, protobuf body). `tsc --noEmit` clean. Span file deleted; stub stopped. Nothing sent to AgentScore.

**Idempotency:** second pass (detect said already_set_up; configure_env reported no changes; no edits) changed no files: `idempotency.json` is `{"changed": []}`. (The first re-run attempt hit a dead stub and failed to call the model; I restarted the stub and the re-verification passed. No file hashes were affected.)

**Next steps for the user:**
1. Create an ingest key in AgentScore under Integrations.
2. Add it to .env yourself with the hidden-input command:
   `! printf 'AgentScore ingest key (tk_...): '; stty -echo; read k; stty echo; echo; printf 'OTEL_EXPORTER_OTLP_TRACES_HEADERS=Authorization=Bearer%%20%s\n' "$k" >> .env; unset k`
3. Then ask to run the agent once for a real send (`npm start`, without AGENTSCORE_EXPORTER). In AgentScore open Agents: it shows Setting up, then Learning your agent (n of 20 traces); scoring begins at about 20 traces, so run realistic traffic including failures.

Notes: `npm install` printed audit warnings (not addressed). `node_modules` is not in .gitignore (pre-existing project state). Nothing committed. No WARN lines from span_tree.

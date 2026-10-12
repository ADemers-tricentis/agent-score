# AgentScore setup report: order-support-agent

Detected: Node/TypeScript (ESM, NodeNext), npm, Vercel AI SDK `ai` 5.0.272 with @ai-sdk/openai, entrypoint src/agent.ts, no prior telemetry.

Instrumentation: `@arizeai/openinference-vercel@^2` span processors (ai v5 path). The framework emits agent, LLM and tool spans itself, so no manual spans.

Files created or changed (in project/):
- src/agentscore-otel.ts (new bootstrap, service name order-support-agent, OpenInference processors, `-proto` exporter)
- src/agent.ts: import `./agentscore-otel.js` as the first import; `experimental_telemetry: { isEnabled: true, functionId: "order-support-agent" }` on the single generateText call
- package.json, package-lock.json: added @arizeai/openinference-vercel ^2.8.1, @opentelemetry/api, core, exporter-trace-otlp-proto, sdk-node, sdk-trace-base
- .gitignore (new; covers .env and .agentscore-spans.jsonl), .env.example (placeholders, `tk_REPLACE_ME`), .env (endpoint and service name only, no key)

Verification (ran, not just static), using the local stub OpenAI server:
- Console mode + span_tree.py: RESULT passed, all 10 checks PASS, one trace of 4 spans (AGENT ai.generateText, LLM, TOOL lookup_order, LLM). No WARN lines.
- wire_check.py: all PASS (path /external/otel/v1/traces, bearer header from env, protobuf body, non-empty).
- `tsc --noEmit` clean. .agentscore-spans.jsonl deleted afterwards.
- Not done: no real send to AgentScore (no ingest key exists, nothing sent to the real URL). `npm install` reported audit advisories, not addressed (out of scope).

Idempotency: second pass detected already_set_up, configure_env.py reported everything unchanged, deps declared, bootstrap present and imported first; checksums of all project files identical (changed: []).

Next step for the user: create an ingest key in AgentScore under Integrations, then add it themselves with the `!` command (`! printf 'AgentScore ingest key (tk_...): '; stty -echo; read k; stty echo; echo; printf 'OTEL_EXPORTER_OTLP_TRACES_HEADERS=Authorization=Bearer%%20%s\n' "$k" >> .env; unset k`). Then run `npm start` with real traffic (no AGENTSCORE_EXPORTER) and watch Agents in AgentScore: Setting up, then "n of 20 traces"; scoring starts around 20 traces. Short-lived script note: if you ever call process.exit(), `await sdk.shutdown()` first.

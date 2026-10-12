# AgentScore setup report: order-support-agent

Detected: TypeScript, ESM, npm, Vercel AI SDK (ai 5.0.272), OpenAI provider, entrypoint src/agent.ts, no prior telemetry.
Ingest base URL: https://agent-score-ingest.product.tricentis.com (user supplied). No ingest key exists.

Files created/changed:
- src/agentscore-otel.ts (new bootstrap, OpenInference Vercel span processors, -proto exporter)
- src/agent.ts: first import `./agentscore-otel.js`; `experimental_telemetry: { isEnabled: true, functionId: "order-support-agent" }` on the one generateText call (needed for ai v5)
- package.json, package-lock.json: @arizeai/openinference-vercel@^2.8.1, @opentelemetry/{api,core,sdk-node,sdk-trace-base,exporter-trace-otlp-proto}
- .gitignore (.env, .agentscore-spans.jsonl), .env.example (tk_REPLACE_ME placeholder only), .env (endpoint + service name only, no key)

Verification (ran, against local stub OpenAI server, nothing sent to the real ingest):
- Console mode + span_tree.py: PASS (1 trace, agent root, 2 LLM spans with model/tokens/prompt, 1 TOOL span lookup_order, no key in data). No WARNs.
- wire_check.py: all PASS (path /external/otel/v1/traces, bearer from env, protobuf body).
- .agentscore-spans.jsonl deleted afterwards.
- Real export NOT run: no key. npm audit reported advisories in dependencies; not addressed.

Next steps for the user: create an ingest key under Integrations in AgentScore, add it to .env with the hidden-input `!` command from the skill (OTEL_EXPORTER_OTLP_TRACES_HEADERS=Authorization=Bearer%20tk_...), run `npm start` once, then check Agents in AgentScore for "Learning your agent" (scoring after ~20 traces, use realistic traffic including failures).

Idempotency pass: detect reported already_set_up; configure_env.py reported no changes; console and wire checks passed again; project file hashes unchanged (only a macOS .DS_Store touched by Finder, not by the skill).

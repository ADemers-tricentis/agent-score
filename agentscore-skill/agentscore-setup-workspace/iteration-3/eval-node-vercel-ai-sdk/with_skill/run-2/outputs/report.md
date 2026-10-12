# AgentScore setup report: order-support-agent

Detected: Node/TypeScript (ESM, NodeNext), npm, Vercel AI SDK `ai` 5.0.272, OpenAI provider, entrypoint src/agent.ts. No prior telemetry.

Changed/created (in project/):
- src/agentscore-otel.ts (new bootstrap, service name order-support-agent, OpenInference Vercel span processors in wrap())
- src/agent.ts: `import "./agentscore-otel.js";` as first import; `experimental_telemetry: { isEnabled: true, functionId: "order-support-agent" }` on the generateText call
- package.json, package-lock.json
- .env.example (placeholder `tk_REPLACE_ME`), .env (endpoint and service name only, no key), .gitignore (.env, .agentscore-spans.jsonl)

Dependencies added: @arizeai/openinference-vercel ^2.8.1, @opentelemetry/api, core, exporter-trace-otlp-proto (protobuf), sdk-node, sdk-trace-base.

Ingest URL: https://agent-score-ingest.product.tricentis.com (traces at /external/otel/v1/traces).

Verification (ran, against local stub OpenAI server; nothing sent to the real ingest):
- Console-mode run + span_tree.py: PASSED (agent root, 2 LLM spans with model/tokens/prompt, 1 tool span lookup_order, no noise, no key).
- wire_check.py: all PASS (path, bearer from env, protobuf body). An earlier attempt failed only because the stub server had stopped; rerun with it up passed.
- .agentscore-spans.jsonl deleted. No WARN lines.
- Not done: no real send (no key exists).

Next steps for the user: create an ingest key in AgentScore (Integrations), add it to .env with the hidden-input `!` command from references/endpoint-and-auth.md (OTEL_EXPORTER_OTLP_TRACES_HEADERS=Authorization=Bearer%20tk_...), run `npm start` once, then check Agents in AgentScore (Setting up, then Learning your agent, n of 20 traces). Run realistic traffic including failures. If you ever call process.exit(), `await sdk.shutdown()` first.

## Second pass (idempotency)
Detected already_set_up, bootstrap imported first, deps declared, configure_env.py re-run (no changes), span_tree.py and wire_check.py re-passed. Result: already set up, 0 project files changed (verified by file hashes).

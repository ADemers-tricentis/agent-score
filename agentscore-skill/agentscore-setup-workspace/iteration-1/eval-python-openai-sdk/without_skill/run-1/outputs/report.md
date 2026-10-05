# AgentScore setup report: order-support agent

Changes (nothing committed, no traces sent anywhere):
- `project/agentscore_tracing.py` (new): OpenTelemetry TracerProvider + OTLP/HTTP exporter to `$AGENTSCORE_INGEST_URL` (default https://agent-score-ingest.product.tricentis.com) at `/v1/traces`, `Authorization: Bearer $AGENTSCORE_INGEST_KEY`. With no key, nothing is exported. `AGENTSCORE_LOCAL_SPANS=1` writes `.agentscore-spans.jsonl`.
- `project/agent.py`: calls `setup_tracing()`; spans for the agent run (`invoke_agent`), each model call (`chat gpt-4o-mini`, with messages, model, tokens, finish reason) and each tool call (`execute_tool`), using OTel GenAI attribute names.
- `project/requirements.txt`: added `opentelemetry-sdk` and `opentelemetry-exporter-otlp-proto-http` (installed in .venv with uv).

Deviation: `opentelemetry-instrumentation-openai-v2` was tried and removed. It is incompatible with this venv (openai uses `httpx2`). I used manual spans instead; see plan.md.

Verification: ran against the local stub; 4 spans (agent, 2 chat, 1 tool) correctly parented. Agent also runs fine without a key. Stub stopped. Second pass: idempotency.json shows `changed: []`.

Caveats: the OTLP path, bearer header and attribute schema are my assumptions, since I had no AgentScore docs. Confirm them against AgentScore's ingest docs. Messages are captured in span attributes, so check that is acceptable for your data.

Next steps for you:
1. Create an ingest key in AgentScore.
2. `export AGENTSCORE_INGEST_KEY=<key>` (don't commit it), then run `python agent.py "Where is order A100?"`.
3. Check the traces appear in AgentScore; adjust header/endpoint if it rejects them.
4. Consider adding `.agentscore-spans.jsonl` and `__pycache__/` to a .gitignore.

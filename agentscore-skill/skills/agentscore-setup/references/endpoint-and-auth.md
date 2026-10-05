# Endpoint, key and environment variables

## Connection facts

| Setting | Value |
|---|---|
| Traces URL | `<ingest base URL>/external/otel/v1/traces` |
| Default base URL | `https://agent-score-ingest.product.tricentis.com` (ask the user to confirm; self-hosted and regional deployments differ) |
| Protocol | OTLP over HTTP with a **protobuf** body (`application/x-protobuf`), gzip accepted. Not JSON, not gRPC: the ingest parses protobuf only, so a JSON body is a 400. |
| Auth | `Authorization: Bearer tk_...` (a per-tenant ingest key; any other prefix is rejected with 401) |
| Where keys come from | AgentScore UI, **Integrations** in the sidebar (create, rotate, revoke). The **Agents > Connect agent** wizard also shows the exact config. |

`/internal/otel/v1/traces` is a different route: unauthenticated and reachable only inside Tricentis's
cluster. Never point a customer at it.

Whether the endpoint needs a VPN or allow-listing depends on the deployment. Do not assume either way; if
a request cannot connect, tell the user to check network reachability to the ingest host.

## Environment variables

Use the `_TRACES_`-suffixed variables. The unsuffixed `OTEL_EXPORTER_OTLP_ENDPOINT` is a base URL that
exporters append `/v1/traces` to, so putting the full path there produces `.../v1/traces/v1/traces`.
Verified: both the Python and Node OTLP HTTP exporters send the `_TRACES_` value to the server as-is.

```dotenv
OTEL_EXPORTER_OTLP_TRACES_ENDPOINT=https://agent-score-ingest.product.tricentis.com/external/otel/v1/traces
OTEL_EXPORTER_OTLP_TRACES_HEADERS=Authorization=Bearer%20tk_xxxxxxxx
OTEL_SERVICE_NAME=my-agent
```

Write the space in `Bearer tk_...` as `%20`. Both SDKs also accept a literal space, but `%20` is what the
OpenTelemetry spec asks for and is safe in every SDK and in shells.

## Handling the ingest key

The key is a credential. It never goes into code, `.env.example`, logs, chat output, command arguments
you run on the user's behalf, or span attributes.

- `.env.example` gets `tk_REPLACE_ME` only. `scripts/configure_env.py` writes it.
- `.env` must be in `.gitignore` before the real key exists. `configure_env.py` does that first.
- The user adds the key themselves. Offer this one-liner, to run with the `!` prefix so the value never
  passes through the conversation (the prompt hides what they type):

```
! printf 'AgentScore ingest key (tk_...): '; stty -echo; read k; stty echo; echo; printf 'OTEL_EXPORTER_OTLP_TRACES_HEADERS=Authorization=Bearer%%20%s\n' "$k" >> .env; unset k
```

  If the prompt cannot take hidden input in their terminal, tell them to open `.env` and paste the
  `OTEL_EXPORTER_OTLP_TRACES_HEADERS=Authorization=Bearer%20tk_...` line by hand.
- If the user pastes a key into the chat anyway, do not repeat it, do not write it anywhere, and tell them
  to use the command above (and to rotate the key if the chat is shared).
- To check the key is present, test for the variable name in `.env` (`grep -c '^OTEL_EXPORTER_OTLP_TRACES_HEADERS=' .env`),
  never print the line.

## What the server answers

| Status | Meaning | Fix |
|---|---|---|
| 202 | Accepted. Spans are queued for assembly. | Nothing; allow a few seconds before they show in the UI. |
| 401 | Missing, malformed or unknown key, or key not prefixed `tk_`. | Check the header, rotate or recreate the key. |
| 403 | Ingestion permanently stopped for this tenant. | Contact the AgentScore team. |
| 503 | Ingestion temporarily disabled or service initializing. Has `Retry-After`. | Exporter retries; wait. |
| 429 | Rate limited or the service is saturated. Has `Retry-After`. | Exporter retries; lower volume if it persists. |
| 413 | Request body over the size cap. | Smaller batches (the bootstrap already uses 64 spans). |
| 400 | Body is not valid OTLP protobuf. | Most often a JSON exporter (Node `exporter-trace-otlp-http`, or `OTEL_EXPORTER_OTLP_PROTOCOL=http/json`); switch to the protobuf exporter. Otherwise a proxy rewriting the body. |
| 408 | Body upload timed out. | Network problem between the app and the ingest host. |

A 202 does not mean the trace was scored. A trace whose spans carry no recognizable agent signal is
recorded as a failure on the AgentScore side; see `attributes.md`.

---
name: agent-score-env-vars
description: Configure OTEL to export to Agent Score using only environment variables, with no code changes required.
---

# Environment Variables - OTEL Configuration for Agent Score

Use this approach when:
- You want zero code changes
- The app already uses the OTEL SDK and reads standard env vars
- You're running in a container, CI/CD, or deployment platform where env vars are easy to set

## Required environment variables

```bash
# Full traces endpoint (signal-specific)
OTEL_EXPORTER_OTLP_TRACES_ENDPOINT=https://agent-score-ingest.product.tricentis.com/internal/otel/v1/traces

# Auth header with your Agent Score API key
OTEL_EXPORTER_OTLP_TRACES_HEADERS=Authorization=Bearer <your-agent-score-api-key>

# Your application name (shows up in Agent Score UI)
OTEL_SERVICE_NAME=my-agent-app

# Protocol - use http/protobuf (default for most SDKs) or http/json
OTEL_EXPORTER_OTLP_PROTOCOL=http/protobuf
```

## .env file example

```dotenv
OTEL_EXPORTER_OTLP_TRACES_ENDPOINT=https://agent-score-ingest.product.tricentis.com/internal/otel/v1/traces
OTEL_EXPORTER_OTLP_TRACES_HEADERS=Authorization=Bearer as-...
OTEL_SERVICE_NAME=my-agent-app
OTEL_EXPORTER_OTLP_PROTOCOL=http/protobuf
```

## Distinction: base URL vs signal-specific endpoint

Different SDKs handle the endpoint variable differently:

| Variable | Behavior |
|---|---|
| `OTEL_EXPORTER_OTLP_ENDPOINT` | SDK appends `/v1/traces` automatically. Use `https://agent-score-ingest.product.tricentis.com/internal/otel` (no trailing path). |
| `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT` | SDK uses this URL as-is. Use the full path: `https://agent-score-ingest.product.tricentis.com/internal/otel/v1/traces`. |

**Prefer the signal-specific variable** (`OTEL_EXPORTER_OTLP_TRACES_ENDPOINT`) to avoid ambiguity.

## Docker / docker-compose example

```yaml
services:
  my-app:
    image: my-app:latest
    environment:
      - OTEL_EXPORTER_OTLP_TRACES_ENDPOINT=https://agent-score-ingest.product.tricentis.com/internal/otel/v1/traces
      - OTEL_EXPORTER_OTLP_TRACES_HEADERS=Authorization=Bearer ${AGENT_SCORE_API_KEY}
      - OTEL_SERVICE_NAME=my-agent-app
      - OTEL_EXPORTER_OTLP_PROTOCOL=http/protobuf
```

Pass `AGENT_SCORE_API_KEY` from the host shell so it is never written to the compose file.

## Kubernetes example

Create a secret for the API key:

```bash
kubectl create secret generic agent-score-secret \
  --from-literal=api-key=as-...
```

Reference it in your deployment:

```yaml
env:
  - name: OTEL_EXPORTER_OTLP_TRACES_ENDPOINT
    value: "https://agent-score-ingest.product.tricentis.com/internal/otel/v1/traces"
  - name: OTEL_EXPORTER_OTLP_TRACES_HEADERS
    value: "Authorization=Bearer $(AGENT_SCORE_API_KEY)"
  - name: AGENT_SCORE_API_KEY
    valueFrom:
      secretKeyRef:
        name: agent-score-secret
        key: api-key
  - name: OTEL_SERVICE_NAME
    value: "my-agent-app"
```

## GitHub Actions example

Store the key as a repository secret (`AGENT_SCORE_API_KEY`), then:

```yaml
- name: Run agent tests
  env:
    OTEL_EXPORTER_OTLP_TRACES_ENDPOINT: https://agent-score-ingest.product.tricentis.com/internal/otel/v1/traces
    OTEL_EXPORTER_OTLP_TRACES_HEADERS: "Authorization=Bearer ${{ secrets.AGENT_SCORE_API_KEY }}"
    OTEL_SERVICE_NAME: my-agent-app
  run: python run_agent.py
```

## Troubleshooting

- **Traces not appearing** - Run `env | grep OTEL` to confirm variables are set. Check for typos in the header value (format is `key=value`, not `key: value`).
- **SDK ignoring env vars** - Some older SDK versions or manually constructed exporters do not read env vars automatically. Use code-based config from [python.md](python.md) or [nodejs.md](nodejs.md) instead.
- **Multiple headers** - Separate multiple headers with a comma: `OTEL_EXPORTER_OTLP_TRACES_HEADERS=Authorization=Bearer as-...,x-env=prod`.

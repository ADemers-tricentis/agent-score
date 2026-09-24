---
name: agent-score-nodejs
description: Configure OTEL tracing for Node.js and TypeScript applications to export to Agent Score.
---

# Node.js / TypeScript - OTEL Configuration for Agent Score

> **Endpoint:** `https://agent-score-ingest.product.tricentis.com/external/otel/v1/traces`,
> auth `Authorization: Bearer <tk_... ingest key>`, reachable over the Tricentis
> VPN only. After wiring the exporter, make sure spans carry attributes Agent
> Score recognizes so the agent is scored, not just ingested - see
> [semantic-conventions.md](semantic-conventions.md).

## Required packages

```bash
npm install @opentelemetry/sdk-node \
            @opentelemetry/exporter-trace-otlp-proto \
            @opentelemetry/resources \
            @opentelemetry/semantic-conventions
```

For framework auto-instrumentation:

| Framework | Package |
|---|---|
| OpenAI SDK | `@opentelemetry/instrumentation-openai` (community) |
| LangChain.js | `@langchain/core` has built-in callbacks; use `LangSmithTracer` or OTEL callback |
| http/https | `@opentelemetry/instrumentation-http` |
| fetch | `@opentelemetry/instrumentation-undici` |

## Minimal setup

Create `instrumentation.ts` (or `instrumentation.js`) and load it before anything else:

```typescript
import { NodeSDK } from "@opentelemetry/sdk-node";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-proto";
import { resourceFromAttributes } from "@opentelemetry/resources";
import { ATTR_SERVICE_NAME } from "@opentelemetry/semantic-conventions";

const exporter = new OTLPTraceExporter({
  url: "https://agent-score-ingest.product.tricentis.com/external/otel/v1/traces",
  headers: {
    Authorization: `Bearer ${process.env.AGENT_SCORE_API_KEY!}`,
  },
});

const sdk = new NodeSDK({
  resource: resourceFromAttributes({
    [ATTR_SERVICE_NAME]: process.env.OTEL_SERVICE_NAME ?? "my-agent-app",
  }),
  traceExporter: exporter,
});

sdk.start();

process.on("SIGTERM", () => {
  sdk.shutdown().finally(() => process.exit(0));
});
```

## Loading the instrumentation file

### Via Node.js `--require` flag

```bash
node --require ./instrumentation.js your-app.js
```

Or in `package.json`:

```json
{
  "scripts": {
    "start": "node --require ./instrumentation.js dist/index.js"
  }
}
```

### Via `NODE_OPTIONS` environment variable

```bash
export NODE_OPTIONS="--require ./instrumentation.js"
npm start
```

### TypeScript with `ts-node`

```bash
ts-node --require ./instrumentation.ts src/index.ts
```

## HTTP exporter alternative (JSON instead of protobuf)

If you prefer JSON over protobuf:

```bash
npm install @opentelemetry/exporter-trace-otlp-http
```

```typescript
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";

const exporter = new OTLPTraceExporter({
  url: "https://agent-score-ingest.product.tricentis.com/external/otel/v1/traces",
  headers: { Authorization: `Bearer ${process.env.AGENT_SCORE_API_KEY!}` },
});
```

## Vercel AI SDK

Vercel AI SDK has built-in OTEL support via the `experimental_telemetry` option:

```typescript
import { generateText } from "ai";

// The SDK picks up the active tracer provider automatically.
// Call sdk.start() from instrumentation.ts before this runs.

const result = await generateText({
  model: openai("gpt-4o"),
  prompt: "...",
  experimental_telemetry: { isEnabled: true },
});
```

## .env example

```dotenv
AGENT_SCORE_API_KEY=tk_...
OTEL_SERVICE_NAME=my-agent-app
```

Load with `dotenv`:

```typescript
import "dotenv/config"; // must be the first import
```

## Troubleshooting

- **No traces in Agent Score** - Confirm `AGENT_SCORE_API_KEY` is set. Run with `OTEL_LOG_LEVEL=debug` for verbose output.
- **401 errors** - The ingest key is wrong, disabled, or rotated. Create or rotate it in Agent Score UI -> Integrations (keys look like `tk_...`).
- **Connection errors** - The ingest endpoint is reachable over the Tricentis VPN only. Confirm the host can reach `agent-score-ingest.product.tricentis.com`.
- **Traces ingest but the agent doesn't score** - Spans are missing recognized attributes. See [semantic-conventions.md](semantic-conventions.md).
- **Traces only showing after process exit** - The `BatchSpanProcessor` flushes on shutdown. For short-lived scripts, use `SimpleSpanProcessor` instead, or call `sdk.shutdown()` explicitly.
- **ESM / import issues** - Use `--import` instead of `--require` for ES modules: `node --import ./instrumentation.js`.

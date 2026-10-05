# Node / TypeScript setup

Template: `assets/agentscore-otel.ts` (rename to `.js`/`.mjs` and strip the type annotations for a plain
JavaScript project). Copy it into the source directory, replace `__SERVICE_NAME__`, and fill the
`// __INSTRUMENTORS__` line or the processor (see the Vercel section). Keep the `agentscore-setup:v1`
marker on line 1.

## Packages

Always: `@opentelemetry/sdk-node`, `@opentelemetry/exporter-trace-otlp-proto`,
`@opentelemetry/sdk-trace-base`, `@opentelemetry/core`, `@opentelemetry/api`.
Plus the instrumentor packages from `instrumentors.md`.

**Use the `-proto` exporter, never `-http` or `-grpc`.** `@opentelemetry/exporter-trace-otlp-http` sends JSON
(measured from the package source: JsonTraceSerializer, `application/json`) and AgentScore's ingest parses
protobuf only, so every export would be rejected with a 400. If the project already depends on the `-http`
exporter for another backend, leave it and add `-proto` for AgentScore.

| Detected | Command |
|---|---|
| npm | `npm install <pkgs>` |
| pnpm | `pnpm add <pkgs>` |
| yarn | `yarn add <pkgs>` |
| bun | `bun add <pkgs>` |

Show the lines you are about to add before running the install, skip packages already in
`package.json`, and show `git diff` of `package.json` afterwards. Keep to the major versions of
OpenTelemetry packages already in the project, because mixing SDK majors breaks span export.

The template reads `.env` through `process.loadEnvFile()` (Node 20.12+ and 21.7+). On an older Node, add
`dotenv` and `import "dotenv/config"` at the top of the template instead.

## Wiring the bootstrap

Load it before anything that creates an LLM client:

- ESM / TypeScript: make it the first import of the entrypoint, `import "./agentscore-otel.js";`
  (with `NodeNext` module resolution the specifier ends in `.js` even for a `.ts` file).
- CommonJS: `require("./agentscore-otel")` first, or run with `node --require ./agentscore-otel.js`.
- Next.js: put the content in `instrumentation.ts` under `register()` instead of importing it.

One import line is the change; do not reorganize the app.

## Instrumentor lines

For SDK-level instrumentors, put the instance in the `NodeSDK` `instrumentations: [...]` array where the
template marks `// __INSTRUMENTORS__`:

```ts
import { OpenAIInstrumentation } from "@arizeai/openinference-instrumentation-openai";
// ...
instrumentations: [new OpenAIInstrumentation()],
```

Caveat for ESM projects: OpenInference's JS instrumentors patch modules at `require` time, which does not
reach ES module imports. If spans do not appear, call the instrumentor's `manuallyInstrument(OpenAI)`
with the imported class instead (see that package's README). This was not exercised here; confirm with
`span_tree.py`.

For plain SDK code you still need the root and tool spans from `manual-spans.md`.

## Vercel AI SDK

Check the major version of `ai` in `package.json` first. The span shape and the right package differ.

**`ai` v7** (needs Node 22+ and ESM; verified):

```
npm i @ai-sdk/otel @arizeai/openinference-vercel@^3
```

In the bootstrap, import the processors and the telemetry integration, swap the `wrap` function, and
register the integration after `sdk.start()`:

```ts
import { OpenTelemetry } from "@ai-sdk/otel";
import { registerTelemetry } from "ai";
import {
  OpenInferenceBatchSpanProcessor,
  OpenInferenceSimpleSpanProcessor,
} from "@arizeai/openinference-vercel";

function wrap(exporter: SpanExporter, immediate: boolean) {
  return immediate
    ? new OpenInferenceSimpleSpanProcessor({ exporter })
    : new OpenInferenceBatchSpanProcessor({ exporter, config: { maxExportBatchSize: 64 } });
}
// ...after sdk.start():
registerTelemetry(new OpenTelemetry());
```

No change to call sites is needed; v7 emits telemetry by default. Without the OpenInference processor, v7's
`agent_step` spans make AgentScore reject the whole trace.

**`ai` v4 to v6** (v5 verified): `npm i @arizeai/openinference-vercel@^2`, and the same `wrap` swap
without the `@ai-sdk/otel` lines. These versions only emit spans when the call opts in, so add
`experimental_telemetry: { isEnabled: true, functionId: "<agent name>" }` to each `generateText`,
`streamText`, `generateObject` or `streamObject` call. That is the one change to user code; show it in the
plan and list the call sites.

Either way the result was one trace: an agent span, a CHAIN or LLM span per step, and a TOOL span per tool.

## Short-lived scripts

The batch processor exports on a timer. A script that exits right after the agent returns can lose its last
spans. The template flushes on `beforeExit` and on SIGINT/SIGTERM; if the process ends with
`process.exit()`, tell the user to `await sdk.shutdown()` first (import `sdk` from the bootstrap).

## Running the agent for verification

Use the project's own command (`npm start`, `tsx src/agent.ts`, ...) with `AGENTSCORE_EXPORTER=console`.
Provide credentials through the environment only. If the agent cannot run, use the static check.

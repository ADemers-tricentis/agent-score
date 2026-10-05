// agentscore-setup:v1
// Sends this agent's OpenTelemetry traces to AgentScore. Load this file before any
// LLM client is created (first import in the entrypoint, or `node --import`).
//
// Configuration comes from environment variables (see .env.example):
//   OTEL_EXPORTER_OTLP_TRACES_ENDPOINT  full traces URL, ends in /external/otel/v1/traces
//   OTEL_EXPORTER_OTLP_TRACES_HEADERS   Authorization=Bearer%20<ingest key>
//   OTEL_SERVICE_NAME                   shown in AgentScore as the agent's service name
//   AGENTSCORE_EXPORTER=console         write spans to a local JSONL file instead of sending
import { appendFileSync } from "node:fs";
import { ExportResultCode, type ExportResult } from "@opentelemetry/core";
// Must be the -proto package: AgentScore accepts protobuf only, and -http sends JSON (HTTP 400).
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-proto";
import { NodeSDK } from "@opentelemetry/sdk-node";
import {
  BatchSpanProcessor,
  SimpleSpanProcessor,
  type ReadableSpan,
  type SpanExporter,
} from "@opentelemetry/sdk-trace-base";

try {
  (process as any).loadEnvFile?.(); // Node 20.12+/21.7+; a missing .env is fine
} catch {}

const spanFile = process.env.AGENTSCORE_SPAN_FILE ?? ".agentscore-spans.jsonl";

// Writes one JSON object per span, in the shape scripts/span_tree.py reads.
class JsonlFileExporter implements SpanExporter {
  export(spans: ReadableSpan[], done: (r: ExportResult) => void): void {
    for (const s of spans) {
      const ctx = s.spanContext();
      const parentId = (s as any).parentSpanContext?.spanId ?? (s as any).parentSpanId ?? null;
      appendFileSync(
        spanFile,
        JSON.stringify({
          name: s.name,
          context: { trace_id: ctx.traceId, span_id: ctx.spanId },
          parent_id: parentId,
          attributes: s.attributes,
          resource: { attributes: s.resource.attributes },
        }) + "\n",
      );
    }
    done({ code: ExportResultCode.SUCCESS });
  }
  shutdown(): Promise<void> {
    return Promise.resolve();
  }
}

// The one place that decides how spans are processed. Some integrations (for example the
// Vercel AI SDK) swap this for a processor that rewrites their spans first.
function wrap(exporter: SpanExporter, immediate: boolean) {
  // 64-span batches and a 30s timeout keep one large batch from tripping the ingest timeout.
  return immediate
    ? new SimpleSpanProcessor(exporter)
    : new BatchSpanProcessor(exporter, { maxExportBatchSize: 64 });
}

function buildProcessor() {
  const wantsConsole = process.env.AGENTSCORE_EXPORTER?.toLowerCase() === "console";
  const configured =
    process.env.OTEL_EXPORTER_OTLP_TRACES_ENDPOINT && process.env.OTEL_EXPORTER_OTLP_TRACES_HEADERS;
  if (wantsConsole || !configured) {
    if (!wantsConsole) {
      console.error(
        `[agentscore] OTEL_EXPORTER_OTLP_TRACES_ENDPOINT/HEADERS not set; writing spans to ${spanFile} instead of sending them.`,
      );
    }
    return wrap(new JsonlFileExporter(), true);
  }
  // Reads the endpoint and headers from the _TRACES_ env vars.
  return wrap(new OTLPTraceExporter({ timeoutMillis: 30000 }), false);
}

export const sdk = new NodeSDK({
  serviceName: process.env.OTEL_SERVICE_NAME ?? "__SERVICE_NAME__",
  spanProcessors: [buildProcessor()],
  // --- instrumentors (added by agentscore-setup) ---
  // __INSTRUMENTORS__
  // --- end instrumentors ---
});

sdk.start();

// Flush buffered spans on exit; short scripts would otherwise lose their last batch.
for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.once(signal, () => sdk.shutdown().finally(() => process.exit(0)));
}
process.once("beforeExit", () => void sdk.shutdown());

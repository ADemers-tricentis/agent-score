# agentscore-setup:v1
# Sends this agent's OpenTelemetry traces to AgentScore. Import this module first
# in the agent entrypoint, before any LLM client is created.
#
# Configuration comes from environment variables (see .env.example):
#   OTEL_EXPORTER_OTLP_TRACES_ENDPOINT  full traces URL, ends in /external/otel/v1/traces
#   OTEL_EXPORTER_OTLP_TRACES_HEADERS   Authorization=Bearer%20<ingest key>
#   OTEL_SERVICE_NAME                   shown in AgentScore as the agent's service name
#   AGENTSCORE_EXPORTER=console         write spans to a local JSONL file instead of sending
import os
import sys

try:
    from dotenv import load_dotenv

    load_dotenv()
except ImportError:
    pass

from opentelemetry import trace
from opentelemetry.sdk.resources import Resource
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import (
    BatchSpanProcessor,
    ConsoleSpanExporter,
    SimpleSpanProcessor,
)

_SPAN_FILE = os.environ.get("AGENTSCORE_SPAN_FILE", ".agentscore-spans.jsonl")


def _build_processor():
    wants_console = os.environ.get("AGENTSCORE_EXPORTER", "").lower() == "console"
    configured = os.environ.get("OTEL_EXPORTER_OTLP_TRACES_ENDPOINT") and os.environ.get(
        "OTEL_EXPORTER_OTLP_TRACES_HEADERS"
    )
    if wants_console or not configured:
        if not wants_console:
            print(
                "[agentscore] OTEL_EXPORTER_OTLP_TRACES_ENDPOINT/HEADERS not set; "
                f"writing spans to {_SPAN_FILE} instead of sending them.",
                file=sys.stderr,
            )
        out = open(_SPAN_FILE, "a", buffering=1)
        exporter = ConsoleSpanExporter(out=out, formatter=lambda s: s.to_json(indent=None) + "\n")
        return SimpleSpanProcessor(exporter)

    from opentelemetry.exporter.otlp.proto.http.trace_exporter import OTLPSpanExporter

    # Reads the endpoint and headers from the _TRACES_ env vars. A 30s timeout and
    # 64-span batches keep one large batch from tripping the ingest request timeout.
    return BatchSpanProcessor(OTLPSpanExporter(timeout=30), max_export_batch_size=64)


def _provider() -> TracerProvider:
    current = trace.get_tracer_provider()
    if isinstance(current, TracerProvider):  # the app already configured OpenTelemetry
        return current
    provider = TracerProvider(
        resource=Resource.create(
            {"service.name": os.environ.get("OTEL_SERVICE_NAME", "__SERVICE_NAME__")}
        )
    )
    trace.set_tracer_provider(provider)
    return provider


provider = _provider()
provider.add_span_processor(_build_processor())

# --- instrumentors (added by agentscore-setup) ---
# __INSTRUMENTORS__
# --- end instrumentors ---

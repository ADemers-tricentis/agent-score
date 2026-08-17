"""OTel wiring for AgentScore, per agent-score-skill/skills/agent-score/references/python.md."""

import os

from opentelemetry import trace
from opentelemetry.sdk.resources import SERVICE_NAME, Resource
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor, ConsoleSpanExporter
from opentelemetry.exporter.otlp.proto.http.trace_exporter import OTLPSpanExporter

DEFAULT_ENDPOINT = "https://agent-score-ingest.product.tricentis.com/external/otel/v1/traces"

_configured = False


def configure_agent_score(service_name: str = "rag-support-agent", force_console: bool = False) -> TracerProvider:
    """Set the global TracerProvider to export to AgentScore (or console if no API key is set)."""
    global _configured
    provider = TracerProvider(resource=Resource.create({SERVICE_NAME: service_name}))

    api_key = None if force_console else os.environ.get("AGENT_SCORE_API_KEY")
    if api_key:
        endpoint = os.environ.get("OTEL_EXPORTER_OTLP_TRACES_ENDPOINT", DEFAULT_ENDPOINT)
        exporter = OTLPSpanExporter(
            endpoint=endpoint,
            headers={"Authorization": f"Bearer {api_key}"},
            timeout=30,  # default 10s is too short once a batch gets large
        )
    else:
        if not _configured:
            print(
                "[otel_setup] AGENT_SCORE_API_KEY not set - exporting spans to the console "
                "instead of AgentScore. Set AGENT_SCORE_API_KEY in .env to send real traces."
            )
        exporter = ConsoleSpanExporter()

    # Smaller batches so a big synthetic run (hundreds of spans) doesn't
    # queue into one slow request the ingest service times out on.
    provider.add_span_processor(
        BatchSpanProcessor(exporter, max_export_batch_size=64, schedule_delay_millis=2000)
    )
    trace.set_tracer_provider(provider)
    _configured = True
    return provider


def get_tracer(name: str = "rag-support-agent"):
    return trace.get_tracer(name)

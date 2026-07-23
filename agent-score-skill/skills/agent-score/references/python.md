---
name: agent-score-python
description: Configure OTEL tracing for Python applications to export to Agent Score.
---

# Python - OTEL Configuration for Agent Score

## Required packages

```bash
pip install opentelemetry-sdk opentelemetry-exporter-otlp-proto-http
```

For framework-specific auto-instrumentation, also install the relevant package:

| Framework | Package |
|---|---|
| OpenAI SDK | `opentelemetry-instrumentation-openai` |
| LangChain | `opentelemetry-instrumentation-langchain` |
| LlamaIndex | `llama-index-instrumentation-opentelemetry` |
| httpx | `opentelemetry-instrumentation-httpx` |
| requests | `opentelemetry-instrumentation-requests` |

## Minimal setup

Add this to your application entrypoint (before any LLM calls):

```python
import os
from opentelemetry import trace
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from opentelemetry.exporter.otlp.proto.http.trace_exporter import OTLPSpanExporter

def configure_agent_score():
    api_key = os.environ["AGENT_SCORE_API_KEY"]

    exporter = OTLPSpanExporter(
        endpoint="https://agent-score-ingest.product.tricentis.com/internal/otel/v1/traces",
        headers={"Authorization": f"Bearer {api_key}"},
    )

    provider = TracerProvider()
    provider.add_span_processor(BatchSpanProcessor(exporter))
    trace.set_tracer_provider(provider)

configure_agent_score()
```

## With framework auto-instrumentation

### OpenAI SDK

```python
from opentelemetry.instrumentation.openai import OpenAIInstrumentor

configure_agent_score()  # call setup first
OpenAIInstrumentor().instrument()
```

### LangChain

```python
from opentelemetry.instrumentation.langchain import LangchainInstrumentor

configure_agent_score()
LangchainInstrumentor().instrument()
```

### LlamaIndex

```python
from llama_index.core import Settings
from llama_index.instrumentation.opentelemetry import OpenTelemetryHandler
import llama_index.core.instrumentation as instrument_module

configure_agent_score()
handler = OpenTelemetryHandler()
instrument_module.get_dispatcher().add_span_handler(handler)
```

## Environment variables

If you prefer environment-variable-only configuration (no code changes), see [env-vars.md](env-vars.md).

## .env example

```dotenv
AGENT_SCORE_API_KEY=as-...
OTEL_SERVICE_NAME=my-agent-app
```

Load with `python-dotenv`:

```python
from dotenv import load_dotenv
load_dotenv()
configure_agent_score()
```

## OpenAI Agents SDK (agents-as-tool pattern)

The OpenAI Agents SDK has built-in OTEL support via `add_trace_processor`:

```python
import os
from agents import set_trace_processors
from agents.tracing.processors import BatchTraceProcessor
from opentelemetry.exporter.otlp.proto.http.trace_exporter import OTLPSpanExporter

exporter = OTLPSpanExporter(
    endpoint="https://agent-score-ingest.product.tricentis.com/internal/otel/v1/traces",
    headers={"Authorization": f"Bearer {os.environ['AGENT_SCORE_API_KEY']}"},
)
set_trace_processors([BatchTraceProcessor(exporter)])
```

## Troubleshooting

- **No traces in Agent Score** - Confirm `AGENT_SCORE_API_KEY` is set and non-empty. Enable OTEL debug logging: `export OTEL_LOG_LEVEL=debug`.
- **401 errors** - The API key is wrong or expired. Regenerate it in Agent Score UI -> Settings -> API Keys.
- **Connection errors** - Verify network access to `agent-score-ingest.product.tricentis.com` from your environment.
- **Missing spans** - Ensure `configure_agent_score()` is called before any instrumented code runs.

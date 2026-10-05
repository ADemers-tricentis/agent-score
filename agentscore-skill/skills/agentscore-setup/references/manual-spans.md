# Hand-written spans

Use the OpenTelemetry API directly and keep to the smallest set that makes a run scoreable:
one **root agent span** around the entrypoint, one **tool span** per tool dispatch, and (only when no
instrumentor exists for the SDK) one **LLM span** per model call. Anything more is noise.

Why the root span matters: without it each LLM call is its own trace, so AgentScore sees many one-call
runs instead of one run, and tool calls land in different traces from the model turns that requested them.

Attribute choices are the OTel GenAI ones because that is the standard AgentScore declares as its contract.
Use only the operation names `invoke_agent`, `execute_tool` and `chat`; any other `gen_ai.operation.name`
fails the whole trace.

## Root agent span (Python)

Wrap the function that handles one run. Do not change its signature or return value.

```python
from opentelemetry import trace

tracer = trace.get_tracer("<agent name>")

def run(question: str) -> str:
    with tracer.start_as_current_span("invoke_agent <agent name>") as span:
        span.set_attribute("gen_ai.operation.name", "invoke_agent")
        span.set_attribute("gen_ai.agent.name", "<agent name>")
        span.set_attribute("input.value", question)
        answer = _run(question)          # the original body, renamed or left in place
        span.set_attribute("output.value", answer)
        return answer
```

If the app has a conversation or thread id, add `span.set_attribute("session.id", conversation_id)`.
Do not invent one.

To keep the diff small, either rename the original function to `_run` and add the wrapper above (as shown),
or add the `with` block inside the existing function and indent the body.

## Tool span (Python)

Around the line that executes the tool, not around the whole loop:

```python
from opentelemetry.trace import Status, StatusCode

with tracer.start_as_current_span(f"execute_tool {name}") as span:
    span.set_attribute("gen_ai.operation.name", "execute_tool")
    span.set_attribute("gen_ai.tool.name", name)
    span.set_attribute("input.value", json.dumps(args))
    try:
        result = TOOLS[name](**args)
    except Exception as exc:
        span.record_exception(exc)
        span.set_status(Status(StatusCode.ERROR, str(exc)))
        raise
    span.set_attribute("output.value", json.dumps(result, default=str))
```

`input.value` and `output.value` must be strings; JSON-encode structured values. Truncate very large
outputs (a few thousand characters is enough) so one tool result does not dominate the trace.

## Same pattern (TypeScript)

```ts
import { SpanStatusCode, trace } from "@opentelemetry/api";

const tracer = trace.getTracer("<agent name>");

export async function run(question: string): Promise<string> {
  return tracer.startActiveSpan("invoke_agent <agent name>", async (span) => {
    span.setAttributes({
      "gen_ai.operation.name": "invoke_agent",
      "gen_ai.agent.name": "<agent name>",
      "input.value": question,
    });
    try {
      const answer = await runInner(question);
      span.setAttribute("output.value", answer);
      return answer;
    } catch (err) {
      span.recordException(err as Error);
      span.setStatus({ code: SpanStatusCode.ERROR });
      throw err;
    } finally {
      span.end();
    }
  });
}

// per tool dispatch
await tracer.startActiveSpan(`execute_tool ${name}`, async (span) => {
  span.setAttributes({
    "gen_ai.operation.name": "execute_tool",
    "gen_ai.tool.name": name,
    "input.value": JSON.stringify(args),
  });
  try {
    const result = await tools[name](args);
    span.setAttribute("output.value", JSON.stringify(result));
    return result;
  } catch (err) {
    span.recordException(err as Error);
    span.setStatus({ code: SpanStatusCode.ERROR });
    throw err;
  } finally {
    span.end();
  }
});
```

## LLM span, when there is no instrumentor

Only if the provider SDK has no instrumentor from `instrumentors.md`. Wrap the model call:

```python
with tracer.start_as_current_span(f"chat {model}") as span:
    span.set_attribute("gen_ai.operation.name", "chat")
    span.set_attribute("gen_ai.request.model", model)
    span.set_attribute("input.value", json.dumps(messages, default=str))
    response = client.generate(...)
    span.set_attribute("output.value", response_text)
    span.set_attribute("gen_ai.usage.input_tokens", response.usage.input)
    span.set_attribute("gen_ai.usage.output_tokens", response.usage.output)
```

Record token counts only if the SDK reports them; never estimate.

## Checking

Run the agent once with `AGENTSCORE_EXPORTER=console`, then `scripts/span_tree.py`. A good result is one
trace: the agent span at the top, LLM and tool spans beneath it in call order.

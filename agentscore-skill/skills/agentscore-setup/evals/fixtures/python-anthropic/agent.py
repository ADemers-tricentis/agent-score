"""Order-support agent built on the plain Anthropic SDK (Claude)."""
import json
import sys

import anthropic

client = anthropic.Anthropic()

MODEL = "claude-haiku-4-5"

TOOLS = [
    {
        "name": "lookup_order",
        "description": "Look up the status of an order by id.",
        "input_schema": {
            "type": "object",
            "properties": {"order_id": {"type": "string"}},
            "required": ["order_id"],
        },
    }
]

ORDERS = {"A100": {"status": "shipped", "eta": "Friday"}}


def lookup_order(order_id: str) -> dict:
    return ORDERS.get(order_id, {"status": "unknown"})


DISPATCH = {"lookup_order": lookup_order}


def run(question: str) -> str:
    messages = [{"role": "user", "content": question}]
    for _ in range(4):
        response = client.messages.create(
            model=MODEL,
            max_tokens=1024,
            system="You are a concise order-support agent.",
            messages=messages,
            tools=TOOLS,
        )
        if response.stop_reason != "tool_use":
            return "".join(b.text for b in response.content if b.type == "text")
        messages.append({"role": "assistant", "content": response.content})
        results = []
        for block in response.content:
            if block.type == "tool_use":
                result = DISPATCH[block.name](**block.input)
                results.append({"type": "tool_result", "tool_use_id": block.id, "content": json.dumps(result)})
        messages.append({"role": "user", "content": results})
    return "gave up"


if __name__ == "__main__":
    print(run(" ".join(sys.argv[1:]) or "Where is order A100?"))

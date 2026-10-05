"""Order-support agent built on the plain OpenAI SDK."""
import json
import sys

from openai import OpenAI

client = OpenAI()

TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "lookup_order",
            "description": "Look up the status of an order by id.",
            "parameters": {
                "type": "object",
                "properties": {"order_id": {"type": "string"}},
                "required": ["order_id"],
            },
        },
    }
]

ORDERS = {"A100": {"status": "shipped", "eta": "Friday"}}


def lookup_order(order_id: str) -> dict:
    return ORDERS.get(order_id, {"status": "unknown"})


DISPATCH = {"lookup_order": lookup_order}


def run(question: str) -> str:
    messages = [
        {"role": "system", "content": "You are a concise order-support agent."},
        {"role": "user", "content": question},
    ]
    for _ in range(4):
        response = client.chat.completions.create(model="gpt-4o-mini", messages=messages, tools=TOOLS)
        message = response.choices[0].message
        if not message.tool_calls:
            return message.content or ""
        messages.append(message.model_dump(exclude_none=True))
        for call in message.tool_calls:
            result = DISPATCH[call.function.name](**json.loads(call.function.arguments))
            messages.append({"role": "tool", "tool_call_id": call.id, "content": json.dumps(result)})
    return "gave up"


if __name__ == "__main__":
    print(run(" ".join(sys.argv[1:]) or "Where is order A100?"))

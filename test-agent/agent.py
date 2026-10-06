import boto3

MODEL_ID = "us.anthropic.claude-sonnet-4-20250514-v1:0"
client = boto3.client("bedrock-runtime")

SYSTEM = [{"text": "You are a helpful assistant. Use the calculator tool for any arithmetic."}]

TOOLS = {
    "tools": [{
        "toolSpec": {
            "name": "calculator",
            "description": "Evaluate a basic arithmetic expression, e.g. '12 * (3 + 4)'.",
            "inputSchema": {"json": {
                "type": "object",
                "properties": {"expression": {"type": "string"}},
                "required": ["expression"],
            }},
        }
    }]
}

def calculator(expression: str) -> str:
    allowed = set("0123456789+-*/(). ")
    if not set(expression) <= allowed:
        return "error: unsupported characters"
    try:
        return str(eval(expression, {"__builtins__": {}}))
    except Exception as e:
        return f"error: {e}"

def run(user_input: str, messages: list) -> str:
    messages.append({"role": "user", "content": [{"text": user_input}]})
    while True:
        resp = client.converse(
            modelId=MODEL_ID, messages=messages,
            system=SYSTEM, toolConfig=TOOLS,
            inferenceConfig={"maxTokens": 1024},
        )
        msg = resp["output"]["message"]
        messages.append(msg)

        if resp["stopReason"] != "tool_use":
            return "".join(b.get("text", "") for b in msg["content"])

        results = []
        for block in msg["content"]:
            if "toolUse" in block:
                tu = block["toolUse"]
                out = calculator(**tu["input"])
                results.append({"toolResult": {
                    "toolUseId": tu["toolUseId"],
                    "content": [{"text": out}],
                }})
        messages.append({"role": "user", "content": results})

if __name__ == "__main__":
    history = []
    print("Agent ready. Type 'quit' to exit.")
    while True:
        q = input("> ").strip()
        if q.lower() in {"quit", "exit"}:
            break
        print(run(q, history))
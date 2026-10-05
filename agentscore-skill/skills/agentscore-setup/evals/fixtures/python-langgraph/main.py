"""Order-support agent built with LangGraph's prebuilt ReAct agent."""
import sys

from langchain_core.tools import tool
from langchain_openai import ChatOpenAI
from langgraph.prebuilt import create_react_agent


@tool
def lookup_order(order_id: str) -> str:
    """Look up the status of an order by id."""
    return {"A100": "shipped, arrives Friday"}.get(order_id, "unknown order")


model = ChatOpenAI(model="gpt-4o-mini")
agent = create_react_agent(model, [lookup_order], prompt="You are a concise order-support agent.")


def run(question: str) -> str:
    result = agent.invoke({"messages": [("user", question)]})
    return result["messages"][-1].content


if __name__ == "__main__":
    print(run(" ".join(sys.argv[1:]) or "Where is order A100?"))

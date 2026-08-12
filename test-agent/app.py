"""Flask front door for the RAG support agent."""

import os

from flask import Flask, jsonify, request

from otel_setup import configure_agent_score
from rag_agent import SERVICE_NAME, answer_question

configure_agent_score(SERVICE_NAME)

app = Flask(__name__)


@app.get("/health")
def health():
    return jsonify({"status": "ok"})


@app.post("/ask")
def ask():
    payload = request.get_json(silent=True) or {}
    question = payload.get("question", "").strip()
    if not question:
        return jsonify({"error": "Missing 'question' in request body."}), 400

    result = answer_question(question)
    return jsonify(result)


if __name__ == "__main__":
    app.run(port=int(os.environ.get("PORT", 5001)), debug=True)

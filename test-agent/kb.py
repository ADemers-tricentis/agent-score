"""Tiny keyword-search knowledge base built from docs/faq.md.

No embedding API required - good enough for a retrieval-tool demo, and keeps
the agent's only external dependency the Anthropic call itself.
"""

import re
from dataclasses import dataclass
from pathlib import Path

FAQ_PATH = Path(__file__).resolve().parent.parent / "docs" / "faq.md"

STOPWORDS = {
    "the", "a", "an", "is", "it", "to", "of", "and", "or", "in", "on", "for",
    "does", "do", "did", "what", "how", "why", "are", "this", "that", "with",
    "you", "your", "if", "not", "can", "be", "as", "at", "by", "i", "have",
    "has", "there", "who", "would",
}


@dataclass
class Chunk:
    id: str
    title: str
    text: str


def _tokenize(s: str) -> set[str]:
    words = re.findall(r"[a-z0-9]+", s.lower())
    return {w for w in words if w not in STOPWORDS and len(w) > 1}


def load_chunks(path: Path = FAQ_PATH) -> list[Chunk]:
    """Split faq.md into one chunk per '### question' section."""
    raw = path.read_text(encoding="utf-8")
    sections = re.split(r"^### ", raw, flags=re.MULTILINE)[1:]
    chunks = []
    for i, section in enumerate(sections):
        lines = section.strip().splitlines()
        title = lines[0].strip()
        body = "\n".join(lines[1:]).strip()
        chunks.append(Chunk(id=f"faq-{i}", title=title, text=body))
    return chunks


_CHUNKS = load_chunks()


def search(query: str, top_k: int = 3) -> list[Chunk]:
    """Rank chunks by token-overlap score against the query. No external calls."""
    q_tokens = _tokenize(query)
    if not q_tokens:
        return []

    scored = []
    for chunk in _CHUNKS:
        c_tokens = _tokenize(chunk.title) | _tokenize(chunk.text)
        overlap = len(q_tokens & c_tokens)
        if overlap:
            # Slight boost for matches in the title, since it's phrased like a question.
            title_overlap = len(q_tokens & _tokenize(chunk.title))
            score = overlap + title_overlap * 2
            scored.append((score, chunk))

    scored.sort(key=lambda pair: pair[0], reverse=True)
    return [chunk for _, chunk in scored[:top_k]]

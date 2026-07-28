"""Generate AgentScore explainer voiceover clips with Chatterbox TTS.

Run inside the .venv-tts environment:
    source .venv-tts/bin/activate
    python scripts/generate_vo.py
"""

import os
import torch
import torchaudio as ta
from chatterbox.tts import ChatterboxTTS

LINES = {
    "vo1": "Your A I agents are already live, answering support tickets, "
    "writing tests, reviewing code, working around the clock. But if someone "
    "stopped you right now and asked: is it actually working? Would you have "
    "a real answer, or just a feeling?",
    "vo2": "Most teams running A I agents in production have no good answer. "
    "You don't even know what to test in the first place, the blank page "
    "problem. The checks you do write miss what actually matters, so "
    "regressions slip through until a customer complains. When something "
    "breaks, a pass or fail flag doesn't tell you why, and root cause analysis "
    "turns into a manual scavenger hunt. Whether it's a support agent, a test "
    "generator, or a coding assistant, the story is the same: different teams, "
    "different standards, and no objective basis for shipping the next update.",
    "vo3": "AgentScore is the evaluation platform built for A I agents. Instead "
    "of guessing what to test, it watches your agent work, reading the Open "
    "Telemetry traces it already emits, and figures out what actually matters, "
    "before you write a single eval, and before anything ships. It's the "
    "shared grading layer for every agent on the team.",
    "vo4": "Every session gets scored across six dimensions: correctness, "
    "efficiency, relevance, safety, consistency, and tool use, rolled into one "
    "composite grade, A through F. Each session gets a clear pass, partial, or "
    "fail verdict, backed by confidence intervals, so you know when the data "
    "is thin and when the grade is real.",
    "vo5": "When a session fails, AgentScore doesn't just flag it. It traces "
    "the failure back to a root cause, shows the evidence chain step by step, "
    "and recommends exactly what to fix, so debugging an agent stops being "
    "guesswork and starts being an answer.",
    "vo6": "Connect once with standard Open Telemetry, no proprietary S D K "
    "required. Gate deployments in your C I pipeline. Surface the verdict "
    "right inside Tosca, qTest, and A I Workspace. Track quality over time. "
    "One shared standard, for every agent, on every team.",
    "vo7": "Stop guessing whether your agents work. Know it, with confidence, "
    "every time they run. AgentScore. Request access today.",
}

OUT_DIR = os.path.join(os.path.dirname(__file__), "..", "public")

def main():
    device = "mps" if torch.backends.mps.is_available() else "cpu"
    print(f"Loading Chatterbox on {device}...")
    model = ChatterboxTTS.from_pretrained(device=device)

    for name, text in LINES.items():
        print(f"Generating {name}: {text[:60]}...")
        wav = model.generate(text, exaggeration=0.45, cfg_weight=0.4)
        out_path = os.path.join(OUT_DIR, f"{name}.wav")
        ta.save(out_path, wav, model.sr)
        print(f"  -> {out_path}")

if __name__ == "__main__":
    main()

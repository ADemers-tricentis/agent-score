# AgentScore — Sales Pitch Deck Outline

**Prepared by:** Lead PM, AgentScore
**Format:** ~15-20 min live pitch + demo, mirrors the beats and visual language of the `agent-score-video` explainer (same navy/teal/orange brand system, same emotional arc: hook → problem → reveal → proof → ask).
**Audience:** VP Eng / Head of AI, or a TCoE / QA leader evaluating AI-agent quality tooling.

---

## 1. Title Slide
**"AgentScore — the evaluation platform built for AI agents."**
- Wordmark, tagline: *Stop guessing whether your agents work.*
- Presenter name/title, date, "Request access" watermark.

*Speaker note:* Land on the tagline before anything else — it's the thesis the whole deck proves.

---

## 2. Agenda (optional — skip for < 15 min pitches)
1. The problem every team running agents in production has
2. How AgentScore solves it
3. What the score actually looks like
4. How it fits your stack
5. Why AgentScore vs. alternatives
6. Next steps

---

## 3. The Hook
**"Your agents are already live. But is it actually working?"**
- Visual: pulsing "live" dot, single bold question on screen (matches video Scene 1).
- One beat: your AI agents are answering support tickets, writing tests, reviewing code, running around the clock right now.
- The trap question: *if someone asked you today — is it working? — do you have a real answer, or just a feeling?*

*Speaker note:* Pause after the question. Let it be uncomfortable. Don't answer it yet — that's Slide 5.

---

## 4. The Problem
**"Evaluating AI agents is hard."** — three cards, same structure as the video's Problem scene:

| Card | Pain |
|---|---|
| **The blank-page problem** | You don't even know what to test. |
| **Testing the wrong things** | Generic checks miss what actually matters; regressions slip through until a customer complains. |
| **No signal once you do** | A pass/fail flag doesn't tell you why. Root-causing becomes a manual scavenger hunt. |

**Closer line:** *Different teams, different standards — no objective basis for shipping the next update.*

*Speaker note:* Ground this in the prospect's own agents if you know them (support bot, coding assistant, test generator) — the video deliberately keeps this domain-agnostic so it lands for any team.

---

## 5. The Reveal
**"AgentScore figures out what to test by watching your agent work."**
- Reads the OpenTelemetry traces your agent already emits — no proprietary SDK, no manual spec-writing before you get value.
- Figures out what actually matters *before* you write a single eval, and before anything ships.
- Positioning line: **the shared evaluation layer for every agent on the team** — not a point solution for one bot.

*Speaker note:* This is the "how" pivot of the pitch. Emphasize *zero lift to start* — plug in the OTel exporter you likely already have, get signal immediately.

---

## 6. What the Grade Actually Looks Like
Live product screenshot / demo moment — walk through a real scored session:
- **Six scoring dimensions:** Correctness, Efficiency, Relevance, Safety, Consistency, Tool Use.
- Rolled into one **composite grade, A–F** (e.g., 92/100 → A).
- Every session gets a clear **Ship / Ship with notes / Review / Block** verdict.
- **Confidence intervals** on every grade (e.g., 92 ± 3, 240 sessions scored) — so you know when the data is thin vs. when the grade is real.
- Callout: a single weak or unsafe dimension can force a fail regardless of composite score (**safety override** — no strong average can mask a dangerous failure).

*Speaker note:* This is the credibility slide. Statistical rigor (confidence intervals, minimum-sample gating) is the single sharpest differentiator vs. every named competitor — say so explicitly.

---

## 7. Know Why, Not Just What
**Root-cause attribution**, walked through as a chain:
`Session fails → Agent calls wrong tool → Bad data returned → Response sent to user`
- The actual failing step is highlighted (e.g., "Agent calls wrong tool").
- Output: **Root cause: Tool misuse — 92% confidence**, plus the evidence chain and a recommended fix.
- Message: debugging an agent stops being guesswork and starts being an answer.

*Speaker note:* This is where you contrast against a plain pass/fail dashboard. Most eval tools stop at the red X — AgentScore tells you why and what to change.

---

## 8. How It Fits Your Stack
Three-step flow (mirrors the video's Flow scene):
1. **Connect** — via standard OpenTelemetry. No proprietary SDK, works with LangChain, LangGraph, OpenAI Agents SDK, AutoGen, CrewAI, or a custom loop.
2. **Gate** — wire the verdict into your CI pipeline (GitHub Actions / Azure DevOps / Jenkins) so a bad build never ships.
3. **Track** — quality over time, trended per agent, per team.
- Surfacing: results appear **inside Tosca, qTest, and AI Workspace** — practitioners don't need a new tool to learn.
- Tagline: **one shared standard, for every agent, on every team.**

*Speaker note:* For Tricentis-installed-base prospects, lead with the Tosca/qTest surfacing — it's the wedge that a standalone eval vendor can't offer.

---

## 9. Why AgentScore (Competitive Differentiation)
Position against the eval/observability field (LangSmith, Langfuse, Braintrust, Arize, Decagon, etc.) on the axes that matter:

| Where we win | Why it matters |
|---|---|
| **Statistical rigor** — confidence intervals, pass@k reliability, minimum-sample gating before a "Ship" verdict | Nearly absent across the field; most competitors show a score with no reliability signal |
| **Multi-dimensional, domain-agnostic scoring** | Generalizes across support bots, coding assistants, test generators — not one narrow vertical |
| **Safety override** | A single unsafe signal can force fail regardless of composite — prevents a strong average from hiding a dangerous failure |
| **Vendor-neutral via OTel** | No proprietary SDK; bolts onto any agent framework |
| **Root-cause attribution with evidence chain** | Goes beyond pass/fail into an actionable "why" |
| **Native surfacing inside Tosca/qTest/AI Workspace** | Meets practitioners where they already work — no new tool to adopt |

*Speaker note:* Be honest in the room about maturity — position as the rigor and integration path competitors don't have, not as "more features than everyone." If asked directly about a named competitor (e.g., Decagon), acknowledge their strength in turnkey auto-generated tests for pure support use cases, then pivot to cross-domain + statistical rigor as the differentiator.

---

## 10. Proof Points / Path to Value
- What early access / pilot looks like: connect OTel traces, get a scored baseline within days, no code changes to the agent itself.
- Suggested pilot success criteria to propose live: # of agent sessions scored, # of ship/no-ship decisions informed by AgentScore, time saved on manual root-cause investigation.
- (If applicable) name any design-partner or pilot commitments already in motion.

*Speaker note:* If the prospect pushes on "who else uses this," be straight about where the product is in its lifecycle — pilot/design-partner framing is a legitimate and honest sales motion pre-GA; don't imply production references that don't exist yet.

---

## 11. Packaging Direction (optional — include only for buyer-side conversations)
- Ingestion (OTel traces) is free/unmetered — no reason to gate the on-ramp.
- The metered unit is the **scoring run**, billed in credits (scales with # of LLM judge calls per run) — not seats, not raw trace volume.
- Unlimited seats — usage tracks agent/team footprint, not headcount.

*Speaker note:* Keep this directional. Exact credit-to-dollar conversion isn't finalized — don't quote numbers that aren't approved.

---

## 12. What's Next on the Roadmap (optional, for strategic/exec audiences)
- Deeper CI/CD band granularity and reproducibility guarantees.
- Expanding attribution from single-session RCA toward trend-level regression detection.
- Additional host-surface integrations beyond Tosca/qTest/AI Workspace.

*Speaker note:* Keep this slide light and directional — it's a "we're listening to design partners" moment, not a commitment list.

---

## 13. Call to Action
**"Stop guessing whether your agents work. Know it, with confidence, every time they run."**
- **AgentScore. Request access today.**
- Concrete next step: schedule a 30-min technical walkthrough / connect a sandbox OTel trace live in the room.

*Speaker note:* Close on the exact line from the video's CTA scene — it's the tagline everyone should leave remembering.

---

## Appendix (leave-behind slides, not presented live)
- Full dimension glossary (6 core + 5 extended: Correctness, Efficiency, Relevance, Safety, Consistency, Tool Use, Groundedness, Instruction-Following, Transparency, Robustness, Communication).
- Supported ingestion frameworks list.
- Security/deployment model (data residency, self-hosted vs. cloud processing options) — have this ready, it's a near-universal enterprise question.
- One-slide competitive matrix (expand Slide 9 into full detail for a technical audience).

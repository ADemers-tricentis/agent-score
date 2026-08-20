# AgentScore — CPO Keynote Script

**Format:** ~25-28 min main-stage keynote (launch/announcement format) + 5 min live product demo embedded + Q&A buffer
**Speaker:** CPO
**Audience:** Mixed - customers, prospects, partners, press/analysts, internal company-wide. Broader and less technical than the VP Eng / TCoE audience in the standalone sales pitch deck.
**Companion assets:** builds on `AgentScore-Sales-Pitch-Outline.md` (narrative arc, competitive framing) and `AgentScore-Demo-Outline.md` (real click-through), compressed and re-staged for a keynote.
**Brand system:** navy / teal / orange, matches `agent-score-video` and the marketing site.

---

## 0. Run of Show (timing)

| # | Segment | Time | Cumulative |
|---|---|---|---|
| 1 | Cold open / hook | 2 min | 2:00 |
| 2 | The problem | 3 min | 5:00 |
| 3 | The reveal - what AgentScore is | 3 min | 8:00 |
| 4 | Live demo | 5 min | 13:00 |
| 5 | Why this is hard to copy (proof/rigor) | 4 min | 17:00 |
| 6 | Fits your stack, not a new one | 3 min | 20:00 |
| 7 | Momentum + what's next | 3 min | 23:00 |
| 8 | Call to action / close | 2 min | 25:00 |
| - | Q&A buffer | 5-10 min | 30-35:00 |

Stage notes: presenter has a clicker and a live laptop feed for the demo segment (segment 4 only - everything else is slides/video). Keep segment 4 on a pre-warmed browser tab with the real `agent-score/` app running locally or on a demo tenant, logged in, sitting on the Fleet view before you walk on stage. Have a recorded screen-capture backup of the exact same click-path queued in case live demo fails.

---

## 1. Cold Open / Hook (2 min)

**Visual:** dark stage, single spotlight, a pulsing "live" dot on the screen behind the presenter. No logo yet.

**Script:**

> "Right now, while we're standing here, somewhere in this room's company, an AI agent is answering a support ticket. Another one is reviewing a pull request. Another is writing test cases nobody asked it to write yet.
>
> They're not in a lab. They're not in a demo. They're live, right now, making decisions on their own.
>
> So here's the only question that matters: if I asked you, right now, 'is it working?' - would you give me a real answer? Or would you give me a feeling?"

**(Pause. Let it sit.)**

> "Most of you would give me a feeling. And that's not a knock on anyone in this room - it's because until today, there hasn't been a real way to answer that question."

**Speaker note:** Don't answer the question yet. Hold it. This is the exact hook from the sales deck ("Your agents are already live. But is it actually working?") - staged bigger, with the pause doing the work.

---

## 2. The Problem (3 min)

**Visual:** three cards animate in, one at a time, same structure as the explainer video's Problem scene.

**Script:**

> "Why don't we have a real answer? Three reasons, and every team running agents in production hits all three.
>
> First - the blank-page problem. Before you can grade an agent, someone has to decide what 'good' even means for it. What should it never do? What does a great answer look like versus an acceptable one? Most teams never get past this question, so they never start.
>
> Second - even when teams do write some checks, they're testing the wrong things. Generic pass-fail rules miss what actually matters for that specific agent, so regressions slip straight through - until a customer finds them for you.
>
> Third - and this is the one that actually keeps people up at night - even when something does fail, a red X doesn't tell you why. Root-causing an agent failure today is a manual scavenger hunt through logs and transcripts.
>
> Put it together, and different teams end up with different standards, different vibes, no shared, objective basis for shipping the next version of an agent. That's not a tooling gap. That's a governance gap - at the exact moment agents are being handed more autonomy than ever."

**Speaker note:** Ground the three cards in the audience's own world if you know it (support bot, coding assistant, test generator) - the framing is deliberately domain-agnostic so every attendee sees their own agent in it.

---

## 3. The Reveal - What AgentScore Is (3 min)

**Visual:** AgentScore wordmark lands. Tagline underneath: *"Stop guessing whether your agents work."*

**Script:**

> "This is AgentScore. And here's the idea in one sentence: AgentScore scores AI agents the way a test suite scores code.
>
> It doesn't ask you to write evals before you get any value. It reads the OpenTelemetry traces your agent is probably already emitting - no proprietary SDK, nothing new to install - and it watches your agent work. From that, it figures out what actually matters for this specific agent, before you've written a single test.
>
> Every session your agent runs gets scored across multiple dimensions - things like correctness, safety, tool use, consistency - rolled up into one composite score, an A-through-F grade, and a plain verdict: Ship it, review it, or block it.
>
> And when something doesn't pass, AgentScore doesn't stop at the red X. It tells you why - root cause, confidence, the evidence chain that got you there.
>
> This isn't a tool for one bot on one team. It's the shared evaluation layer for every agent your company runs."

**Speaker note:** This is the "how" pivot. The emphasis the sales deck calls out explicitly: *zero lift to start.* Say that phrase out loud - it's the line that turns a skeptical technical buyer into a curious one.

---

## 4. Live Demo (5 min)

**Staging:** Presenter moves to the demo laptop. Screen already on the Fleet view, logged in, before walking on stage. This is a compressed version of the real 8-10 min product click-through in `AgentScore-Demo-Outline.md` - cut to the beats that land for a mixed keynote audience. Practice the timing; if any step lags (scoring run, trace ingestion), have the pre-recorded backup ready to cut to.

**Script + clicks:**

1. **Fleet view (already on screen).**
   > "This is Fleet - every agent your team runs, one screen. Grade, score, verdict, reliability. Not a config screen - a status board. If I'm the person who owns outcomes across every agent this company runs, this is my morning."

2. **Click Add Agent → Setup step.**
   > "Adding a new agent takes one API key - not one per agent - and an endpoint. If your team already has a coding agent wired in, you can literally hand it this instruction and let it configure the tracing for you. Copy-paste, not a build project."

3. **Click through to "waiting for traces" / auto-detection.**
   > "Watch this - the moment a trace lands, AgentScore already knows what kind of agent this is, from its tools, its model, its handoffs. Nobody has to name it or classify it by hand."

4. **Land on Project Overview - Run #1 in progress.**
   > "Notice it doesn't score anything yet. A run stays open, collecting, until there's enough real signal. No decisions get made on thin data."

5. **Scoring tab → click Score now.**
   > "This is a real scoring pass happening live - parallel LLM judges reading through the session traces, not just the final answer the agent gave."

6. **Run view → click into one session.**
   > "And here's the payoff: a full dimension breakdown, and on anything that isn't a clean pass - root cause, confidence, the evidence chain, and a recommended fix. This is the 'why,' not just the 'what.' Ship, hold, or reject - that's still a human call. AgentScore's job is to make sure that call is informed, not guessed."

**Close the demo:**
> "Zero to a graded, defensible ship-or-hold decision. That's the whole loop."

**Speaker note:** If a live glitch happens, don't apologize repeatedly - one light acknowledgment ("looks like our judges are taking their time - let's look at one we ran earlier") and cut to the backup recording.

---

## 5. Why This Is Hard to Copy (4 min)

**Visual:** the credibility slide - a real scored session on screen with confidence interval and verdict badge visible.

**Script:**

> "Anyone can put a score on a screen. Here's what most tools in this space don't do, and why it matters.
>
> Every grade AgentScore gives you comes with a confidence interval. Ninety-two, plus or minus three, across two hundred forty sessions. That number means something completely different than a raw ninety-two with no sample behind it. We gate the 'Ship' verdict on having enough data to actually trust it - not just enough data to produce a number.
>
> That's statistical rigor, and it's nearly absent across this entire field today. Most competitors will show you a score with zero reliability signal behind it. We think a score you can't trust is worse than no score at all - it's false confidence.
>
> Second: safety is not just one more dimension averaged in with the rest. A single unsafe signal can force a fail, full stop, no matter how strong the composite score looks. A great average can never quietly hide a dangerous failure.
>
> Third: root-cause attribution with an actual evidence chain, not a black box. Session fails, agent called the wrong tool, bad data came back, that's what reached the user. Ninety-two percent confidence, here's the fix. That's the difference between a scavenger hunt and an answer.
>
> And it's vendor-neutral by design - standard OpenTelemetry, so it bolts onto LangChain, LangGraph, the OpenAI Agents SDK, AutoGen, CrewAI, or whatever custom loop you've already built. We are not asking you to rebuild your stack to get graded."

**Speaker note:** Be straight, not defensive, if a competitor is named from the floor later. The honest positioning per the sales outline: acknowledge point-solution strengths (e.g., a turnkey support-specific competitor), then pivot to cross-domain scoring plus statistical rigor as what generalizes.

---

## 6. Fits Your Stack, Not a New One (3 min)

**Visual:** three-step flow animation - Connect / Gate / Track. Then a screenshot of a verdict badge surfaced inside a familiar tool.

**Script:**

> "Three steps. Connect over standard OpenTelemetry - no new SDK. Gate the verdict into your CI pipeline so a bad build never ships in the first place. Track quality over time, per agent, per team.
>
> And for everyone already living inside Tosca, qTest, or AI Workspace - you don't need to learn a new tool to see this. The verdict shows up where you already work.
>
> One shared standard. Every agent. Every team."

---

## 7. Momentum + What's Next (3 min)

**Visual:** logos/placeholders for design partners (only if actual commitments exist - do not name specific customers unless legally cleared), roadmap teaser.

**Script:**

> "This is live today, grading real agents inside our own company right now - including some of the agents that helped build this very keynote.
>
> Early access starts with connecting your OTel traces and getting a scored baseline within days - no changes to the agent itself.
>
> What's next: deeper CI/CD integration with reproducibility guarantees, expanding root-cause analysis from a single session into trend-level regression detection across your whole fleet, and more surfaces beyond Tosca, qTest, and AI Workspace. We're building this with design partners in the room, not in a vacuum - what you tell us in the next two quarters directly shapes what ships."

**Speaker note:** Keep the roadmap directional per the sales outline - it's a "we're listening" moment, not a commitment list. Do not quote unapproved dates or numbers.

---

## 8. Call to Action / Close (2 min)

**Visual:** return to the tagline, full screen, wordmark below.

**Script:**

> "Every agent your company ships is a decision - to trust it with a customer, a codebase, a workflow. Right now, most of you are making that decision on a feeling.
>
> Stop guessing whether your agents work. Know it - with confidence, every time they run.
>
> AgentScore. Request access starting today, and if you want to see it live on your own traces, find us at the demo station right after this - we'll connect a sandbox trace with you in the room."

**(Hold on wordmark. Applause beat. Walk off or transition to Q&A.)**

---

## Anticipated Q&A (from the floor)

Reuse verified answers from `AgentScore-Demo-Outline.md` and `AgentScore-Sales-Pitch-Outline.md` - do not improvise numbers live.

- **"Is this real data in the demo?"** Yes - it's currently grading internal agents.
- **"What does it cost?"** Ingestion is free and unmetered. The metered unit is the scoring run, billed in credits that scale with judge calls per run - not seats, not raw trace volume. Exact credit-to-dollar conversion isn't finalized; don't quote a number.
- **"Who else is using this today?"** Be direct about lifecycle stage - this is pilot / design-partner framing pre-GA. Don't imply production references that don't exist.
- **"How is 'what to test' actually decided - is that a black box?"** Auto-generated from evals detected in the agent's own traces at onboarding, and refinable anytime in plain language (Guided mode) or a raw spec (Expert mode) - never opaque, always inspectable and editable.
- **"What triggers a scoring run?"** Both automatic (opened at agent launch, auto-scores daily once ready) and on-demand via a manual "Score now."
- **"Does this replace [named competitor]?"** Acknowledge their strength in their specific niche (e.g., turnkey support-bot testing), then pivot: AgentScore's differentiation is generalizing across agent types plus the statistical rigor layer most of the field doesn't have.
- **"Security / data residency?"** Have the self-hosted vs. cloud-processing model ready as a leave-behind - near-universal enterprise question, don't wing it live.

---

## Pre-Show Checklist

- [ ] Demo tenant/local app running, logged in, sitting on Fleet view before walk-on
- [ ] Backup screen-recording of the exact demo click-path, cued and ready to cut to
- [ ] Confirm no unapproved pricing numbers or customer names are in speaker notes or slides
- [ ] Confirm roadmap slide only shows directional language, no committed dates
- [ ] Mic check on stage laptop audio if demo has any sound cues
- [ ] Clicker paired, slide advance tested end-to-end once live

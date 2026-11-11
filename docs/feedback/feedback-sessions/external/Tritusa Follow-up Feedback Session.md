# AgentScore Demo Debrief - Tritusa Follow-up Feedback Session

**Date of session:** 2026-11-10 (US Central evening; the recording is stamped 2026-11-11 01:01 GMT)
**Source:** `GMT20261111-010114_Recording.transcript.vtt` (Zoom transcript, speaker-labeled)
**Format:** Partner screen-shared their live agent and score, then Andrew demoed improvement advice, custom evals and reporting, followed by go-to-market planning (~26 minutes)
**Analyst:** Lead PM review
**Status:** Actively using. This is the first call with a partner that has a real agent scored in AgentScore.

## Room composition

- **Tricentis side:** Andrew Demers (presenter/PM).
- **Tritusa side (partner):**
  - Jawahar Govindaraj - heads Tritusa's agent practice. Drove the whole call and screen-shared their AI Workspace.
  - Deephan Mohanraj - joined, spoke once at the end to ask for documentation.

*(The transcript mis-hears "Tricentis AI Workspace" as "Tricent ACI workspace", "AI Evals and AI Assurance" as "EAA Evolves and EAA Assurance"/"Yay Evolve", "BFSI" as "BFSA", "SAP Joule" as "ESP JUL"/"SAP JUUL", "eval" as "ZVAL"/"email", and "Claude Code" as "Clawed code".)*

---

## Why Tritusa is here (important context)

This is a follow-up to the [2026-09-11 Tritusa call](Tritusa%20Feedback%20Session.md). Tritusa is now the one beta account recorded as actively using AgentScore, and they brought a real result: a **qTest traceability-report agent ("trace collector") built in Tricentis AI Workspace**, with about 43 traces and a **score of 63.4**. The agent takes a qTest ID and a tester profile and produces a full traceability report (requirements, test cases, test runs, results, defects) with summary tables and charts. Jawahar called the output "a beautiful report", which is why the low score confused him.

The business context is bigger than one agent. Tritusa plans to offer **"AI Evals and AI Assurance" as a service**: take an agent someone else built, evaluate it with AgentScore, hand back a report, and advise on how to raise the score. That makes readable scores, actionable advice and an exportable report core to their offering, not nice-to-haves.

---

## What landed

**1. Assistant and MCP for step-by-step improvement advice.**
Andrew showed the Assistant tab reading the agent's traces and returning prioritized fixes (tool directives, connection failures), and the same flow from Claude Code over the AgentScore MCP (connected from the Integrations tab for Cursor, Codex or Claude). For AI Workspace agents, the Assistant can write the fix instructions in a form you paste straight into the AI Workspace agent. Jawahar's plan is to ask Claude directly: "how do I get from 65% to 90-95%?"

**2. Profile fit as a cause of a low score.**
Andrew suggested the default profile may not fit what the agent actually does, and that generating a profile from the traces can propose more relevant evals, applied from the Evals tab. This reframed a 63.4 from "the agent is bad" to "check you are grading the right things".

**3. Custom safety evals and guardrails.**
Jawahar asked how each company can add its own guardrails (bias, banned keywords, risk, regulatory, GDPR, BFSI rules). Andrew showed the built-in safety catalog and then a custom eval: describe what is checked, what earns full marks, and what earns zero (example: no PII such as name or date of birth), then preview it against an agent's traces. Binary 0/1 scoring links each failure to the exact trace, and a threshold rule like "no critical or high finding, at most one medium" also works. The point that you only need to know what you are looking for, and the Assistant or MCP will write the rubric, was well received.

**4. Editable eval weights.**
Jawahar confirmed he can edit eval parameters. Andrew showed raising the safety weight so safety failures pull the score down harder.

**5. Evaluation best practice for the white paper.**
Andrew's advice, which Jawahar called "brilliant": start from the agent's success criteria, map each behavior to an eval with a clear rubric, and add a golden dataset of good and bad results.

---

## What could have gone better / gaps surfaced

**1. Improvement advice is hard to act on for prompt-only agents.**
Jawahar's agent only calls standard Tricentis MCP functions (qTest, Tosca), so the prompt is the only lever he thinks he has. He said the current suggestions are not readable enough, and that the score keeps shifting as parameters change. He still left without knowing where the 63.4 comes from. If the advice for this kind of agent comes down to "improve your prompt", it needs to say which prompt change and why.

**2. No client-facing audit report.**
"At the end of the day, if you're offering us a service, we have to share a report": how the agent works, which profile was used, and the final score. Andrew generated a findings report through a coding agent and the MCP (findings plus per-eval results across recent runs), but saving it as an HTML file failed live. Andrew said it would be fixed. For Tritusa's service model this is the deliverable.

**3. Industry and regional compliance packs do not exist.**
Custom evals answer "can I add my own rule", but Jawahar's framing was per-industry and per-region standards (BFSI, EU/GDPR, data privacy, risk and regulatory). This is the same compliance gap from the first Tritusa call. It is now partly covered by custom evals, but there is no ready-made pack.

**4. No third-party platform connectors.**
Asked about Microsoft Copilot and SAP Joule. Neither is supported. Andrew offered to build a custom connector for whichever platform matters most to Tritusa, noting there had not been demand before. Tritusa has recently built SAP Joule agents (SAP QA is their core business) and offered to share them for testing.

**5. MCP login was flaky on the internal tenant during the demo.**
Andrew had to fall back to a different Claude Code session before the MCP connected. It worked in the end, but it is worth checking before the next partner demo.

---

## Follow-ups Andrew committed to

1. **Send updated documentation** covering the MCP and what you can ask it (Deephan asked for this too).
2. **Fix saving the report as an HTML file.**
3. **Talk to the team about an SAP Joule agent connector** and circle back.
4. **Review Tritusa's white paper draft** (2-3 pages) and send corrections before they publish it on their site and LinkedIn.
5. **Join a joint webinar** (20-30 minutes, high-level awareness of AgentScore capabilities and how to improve agents). The audience is mainly Australia/New Zealand, plus the US and global. It follows Tritusa's upcoming performance-engineering webinar with Tricentis executives.
6. **Schedule a follow-up troubleshooting call** if the advice still does not help.

Tritusa's side: Jawahar will retry improving the agent with the Assistant and MCP, write the white paper using a sample agent (hello world, stock lookup or materials management), and plan the webinar after the paper is published.

---

## Recommended next steps

1. **Get the qTest trace collector agent from 63.4 to a defensible score with Jawahar on a call.** This is our only actively-using partner, and the agent is built on Tricentis's own MCP tools. If we cannot explain its score, we cannot sell AI Assurance through partners.
2. **Ship the HTML/PDF report export.** It is the missing deliverable for a partner selling evaluation as a service, and the fix looks small.
3. **Treat the white paper and webinar as the co-sell answer we lacked in September.** The first call left "partner co-sell motion" unanswered. Tritusa has now proposed a concrete co-marketing motion, and Andrew has agreed to it.
4. **Decide whether to build an SAP Joule connector.** Tritusa has agents ready to test and SAP QA is their core market. Weigh it against the Agentforce and Copilot asks before committing.
5. **Draft a starter compliance eval pack** (PII, GDPR data privacy, BFSI) on top of custom evals, so the compliance answer stops being "write your own".

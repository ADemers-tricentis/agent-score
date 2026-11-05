# AgentScore — Product Demo Script

**Format:** Recorded screen video, about 9 minutes. Hard cap 10. One voice, one screen. Users watch it on their own.
**Audience:** A QA or quality lead who decides whether an agent can ship, and who has seen Langfuse, Braintrust, Arize, or Galileo. They are not an eval engineer. They do not want a feature tour.
**Claim:** Agent Score grades the agent you already run and hands back one evidence-backed ship / review / don't-ship answer, without the viewer writing tests or labeling data. When that agent has a rule of its own, you say the rule in plain language and Agent Score drafts the eval and a profile for that agent. Nothing is published until you approve it.

Record the path below in order. In the edit, if the cut runs long, shorten the open and the MCP section. Keep the scorecard drill and the eval and profile at full length. The finished video must not show a wait on a scoring job, a preview, or a rescore.

Do not mention simulation, synthetic users, runtime guardrails, an SDK, self-host, or SSO. The video grades behavior that already happened.

---

## Before you record

- Signed in to the demo tenant with a Tosca Cloud account. Cursor is already connected to `agent-score`. Have the browser **Allow** step already finished, so you can drop in a short insert if you want sign-in on screen.
- One agent already producing traces, with a completed scoring run and at least one weak dimension. The docs example is `checkout-agent`. Write these where the voiceover can see them: score, Score-tab verdict, fitted profile name, weak dimension, one high recommendation title, one trace ID, one span ID.
- **Improve** already shows a succeeded advice card ranked **high**, with trace and span IDs in the text.
- The Assistant prompt is ready to paste. Have the draft eval and profile waiting on the approval card, so the recording shows the ask, the approval, and the result, and does not wait on the draft.
- Do not re-send "Set this agent up…" on the agent in the video. That writes a new ingest key. Keep an earlier reply in the Cursor thread and show that.
- Do not click **Score now**, **Regenerate**, **Generate advice**, **Preview on an agent**, or **Save and publish** while recording.
- Read the verdict from the **Score** tab. Crop or scroll past **The bar** on the **Profile** tab. Those labels still say Review required, Block recommended, and Block.

**Lock these before you roll**

- The approval-card button label. The docs say the card stops the action until you approve it. They do not name the button.
- Where the Assistant shows **What is being checked**, **What earns a full score**, **What earns zero**, and **Compiled rubric (read-only)** after you approve a draft. Those fields sit on the eval under **What this check measures**. Reach them from the Assistant reply. Do not open the **Evals** nav, and do not type in the form.
- That the draft profile shows on this agent's **Profile** tab with the new eval in it, before publish. The tab documents the bound profile. This video does not publish.

## Cut

| # | Section | Time | Cumulative |
|---|---|---|---|
| 1 | Open | 0:30 | 0:30 |
| 2 | Connect with MCP | 1:30 | 2:00 |
| 3 | What got measured, and why | 0:45 | 2:45 |
| 4 | The scorecard | 2:00 | 4:45 |
| 5 | A rule of this agent's own | 2:30 | 7:15 |
| 6 | What to do about it | 1:00 | 8:15 |
| 7 | Close | 0:30 | 8:45 |

---

## 1. Open — 0:00 to 0:30

**Screen:** Home, already signed in. Do not tour it.

**Shot:** Hold. No click.

**Voiceover:** "Building checkout-agent was the easy part. Knowing if it is any good is the hard part, unless you write evals for a living. It already produces traces. You connect it from Cursor, and then you read a verdict."

**Viewer takes away:** The video will score an agent that already runs, and end on a ship decision.

## 2. Connect with MCP — 0:30 to 2:00

**Screen:** Sidebar **Integrations**, card **Connect a coding agent (MCP)**, tab **Cursor**. Then the Cursor project.

**Shot:** Hold on **Server URL** and **Copy**, then on **Sign-in** (Tosca Cloud, in the browser, no API key). Optional insert, already recorded: the browser **Allow** click. Cut to the Cursor thread and show this line on screen, already sent:

```
Set this agent up to send its traces to Agent Score. Name it checkout-agent.
```

Then show the check and its answer. Traces for that name arrived in the last hour. Do not read the ingest key.

```
Use agent-score to check my agent connection.
```

**Voiceover:** "Copy this URL and paste it whole. The part after the question mark is your tenant. You sign in with your Tosca Cloud account. There is no API key. In the project you say: Set this agent up to send its traces to Agent Score. Name it checkout-agent. Then ask it to check the connection. Traces for that name arrived. Scoring starts on its own after about 20 real traces. Other tools start with an SDK, a dataset, and a scorer you have to configure. MCP gets you in. The grade is the product."

**Viewer takes away:** They connect from the coding agent they already use. The grade starts from real traces.

## 3. What got measured, and why — 2:00 to 2:45

**Screen:** **My Agents**, then `checkout-agent`.

**Shot:** **Agent Card**. Read **Purpose** only. Then **Profile**. Read **Bound profile** and **Why this profile**. Do not open **Create an eval for this agent**.

**Voiceover:** "Agent Score wrote this purpose from the traces. The card marks it as a draft, not something you typed. It fitted [profile name], the bundle of dimensions for this kind of work. There was no form. The built-in profile is the starting point. Next is a rule the catalog does not have."

**Viewer takes away:** Agent Score recognized the agent and picked the profile. They did not configure a suite.

## 4. The scorecard — 2:45 to 4:45

**Screen:** Same agent, **Score**.

**Shot:** The score and the verdict badge. Scroll to **Where the score comes from**. Open the weak dimension, then its eval. Read the plain-language reason. Click the trace ID and land on that trace. Do not click **Score this trace**. Cut back to the scorecard.

**Voiceover:** "Checkout-agent scored [N]. The verdict is [badge]. Ship is 85 to 100, ship with note is 70 to 84, needs work is 55 to 69, don't ship recommended is 40 to 54, and don't ship is 0 to 39. This eval is why the dimension is weak, and this trace ID is the interaction. Every number has to be traceable, or it is not a decision. A trace dashboard tells you what happened. This scorecard is what you sign."

**Viewer takes away:** One score, one verdict, and a path from the number to the trace.

## 5. A rule of this agent's own — 4:45 to 7:15

**Screen:** Stay on `checkout-agent`.

**Shot:** **Ask the assistant**, so the session is already anchored to this agent. The prompt is on screen. The approval card is already up. Approve the draft only. If a second card offers publish, preview, or rescore, do not approve it and do not leave it in the cut.

```
This checkout agent must never promise a refund. Draft an eval for that, then a profile for this agent that includes it.
```

Show **What this check measures**: **What is being checked**, **What earns a full score**, **What earns zero**, and **Compiled rubric (read-only)**. Then **Profile** on this agent, with the new profile and the refund eval in it.

**Voiceover:** "You state the rule in one sentence. This checkout agent must never promise a refund. Draft an eval for that, then a profile for this agent that includes it. You approve the draft. You do not publish it. Agent Score wrote the three answers, and the rubric under them is what the judge reads. The new profile is on this agent, with that eval in it. A draft stays private until you publish, and a profile can mix this eval with the built-in ones. Elsewhere you write the scorer and assemble the suite. Here you state the rule, and Agent Score writes the eval and the profile."

**Viewer takes away:** They state one rule. Agent Score drafts the eval and the profile. Nothing is published until they approve it.

## 6. What to do about it — 7:15 to 8:15

**Screen:** Same agent, **Improve**.

**Shot:** The succeeded card with the **high** badge. Read the title. Point at one trace ID and one span ID in the body. **Generate advice** stays unclicked.

**Voiceover:** "This one is high. [Read the title.] It cites this trace and this span. The same traces that produced the score also produce the next fix."

**Viewer takes away:** The score and the fix come from the same run.

## 7. Close — 8:15 to 8:45

**Screen:** The advice card, or back on **Score**. No new click.

**Voiceover:** "Agent Score graded the agent you already run and gave you one answer: ship, review, or don't ship. You didn't write a test or label data. You state a rule in plain language, Agent Score drafts the eval and a profile, and nothing is published until you approve it. Connect one of your agents the same way."

**Viewer takes away:** Their next step is to connect an agent they already run and read a verdict.

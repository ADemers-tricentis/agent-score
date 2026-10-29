# AgentScore usability review

Expert usability review of the signed-in product, walked 2026-10-29 as two users: an AI engineer on a first session, and a domain practitioner (a tester with no AI background).

The URL given for the review (`https://agent-score.product.tricentis.com`) returns HTTP 404 "no app matched" on every path tried. The app reviewed is `https://agent-score.ai.tricentis.com`, signed in to the tais tenant.

Two actions during the walk left traces in the product: "Generate advice" was clicked once on "workflows assistant", which uses AI credits, and one verdict threshold was saved (70 → 71) and then restored with "Reset to profile defaults".

## Verdict

AgentScore currently serves an AI engineer who is already comfortable with OTel and judge rationales: the agent Score tab ("62.2 / 100 · Ship needs ≥ 85 · you are 23 below · Scored 2h ago") and the span tree reward someone who knows what they are looking at. The biggest usability risk is that the verdict has no single name: the same 55–69 band appears as "Needs work", "Review", and "Review required" on different screens, and the agent behind the "Ship with note" run on Home shows a plain "Ship" badge on My Agents. That leaves a tester with no reliable answer to "can we ship?". A new engineer can finish most of job 1 alone, but cannot confirm their own first traces arrived from inside the Connect flow, and cannot get from a weak score to the specific tool call that caused it.

## Task results

**Job 1: AI engineer, first session.** Overall: completed with help.

1. **Connect an agent and confirm traces: completed with help.**
   - Home has no connect entry point; the header offers only "Take a tour". The guess was My Agents, where "+ Connect Agent" is the clear primary button.
   - In the "Connect an agent" dialog, step 2 ("Your tenant's key") shows only masked chips ("new-key: tk_...X5sM"), and step 3's snippet contains the placeholder "Bearer <tk_your_key>". The dialog has no control to create or reveal a key and no link to where one lives.
   - Step 4 says "Once this agent has forwarded at least 20 traces… scoring begins automatically." Nothing in the dialog shows whether a trace has arrived.
   - The only arrival signal found was the "Last used" column ("3d ago" / "Never used") under "API keys" on Integrations. That table sits below a long MCP setup section. The Integrations page itself says checking whether traces arrived is something an MCP client does ("whether traces arrived in the last hour").
   - Hesitation: the dialog says "there is nothing to create by hand", while agent Settings says "Create a new agent to use a different name."

2. **Read the latest run's verdict and why: completed.**
   - From Home, "workflows assistant · 62 · Needs work" opens the run page. It shows "62.2 / 100", a "Needs work" pill, and below that "Verdict zone: Review". Two names for one verdict.
   - The first thing in the content is an "Approximate delta" info banner, shown above the result.
   - No A–F grade appears on Home, My Agents, the Score tab, or the run page.
   - The why is in "Evaluation breakdown": "Step Efficiency · Needs attention · 0% · Target: Not provided". Every row says "Target: Not provided".
   - The agent Score tab shows the same evaluations as "step_efficiency · Fail · mean 0 · ≥ 60".

3. **Get from the weak score to the trace or tool call: blocked at the tool-call level.**
   - Clicking the "Step Efficiency" row gave no visible change. A "Step Efficiency — Per-Interaction Scores" panel opened below the table, off-screen.
   - The panel's text is raw judge output: "tool_call_audit reports anchor_score 0.0 with all 15 calls flagged non_productive… residual_hundredths is set to 0." Another entry says the calls "in fact returned usable results", yet still scores 0%.
   - The trace IDs are clickable but look like plain monospace text. Clicking one opened the trace on the root span "agent.execute", with nothing marking which of the 33 spans were at fault.
   - In "Score details", Step Efficiency shows "0.00" (scores on a 0–1 scale here, percentages elsewhere) and lists no EVIDENCE spans for this trace.
   - Evidence span IDs on the trace page are not exposed as buttons or links in the accessibility tree.
   - The trace was reachable; the tool call was not. Only later, in Improve, did the cause appear: tool spans are captured with null input and output, which floors Step Efficiency at 0.

4. **Change something and confirm it took effect: completed for thresholds, blocked for schedule.**
   - Settings → "Verdict thresholds": after "Save thresholds", a "Verdict thresholds saved." toast appeared and the label changed from "Profile defaults" to "Custom thresholds". The copy says "Changes apply to the next scoring run."
   - Back on the Score tab, nothing showed that thresholds were custom, and there was no next-run time.
   - In Settings, "Check frequency (minutes)" and "History window (days)" are empty fields. The Profile tab repeats the same schedule controls as "Autonomous scoring / Cadence (minutes) / Lookback (days)", with "Leave blank to inherit the default". Neither tab shows what the default is, so the current schedule could not be read.

**Job 2: Domain practitioner.** Overall: completed with help.

1. **Decide in under a minute whether it's safe to ship: completed, but labels conflict.**
   - Home's "Verdict trend" counts "Ship 3 · Review 16 · Block 0". The lists below it say "Needs work", "Ship with note", and "Insufficient sample" instead.
   - The run Home shows as "agent_tools_prep · 82 · Ship with note" appears on My Agents with the score 82.4 and a "Ship" badge.
   - The 55–69 band is "Needs work" in Settings, "Review required — you are here" in the Profile tab's "The bar", and "Verdict zone: Review" on the run page.
   - For "workflows assistant", "Ship needs ≥ 85 · you are 23 below" on the Score tab answered the question. For "single workflow assistant", the run shows "— · Insufficient sample · Scored 25 interactions — too few for a verdict". It doesn't say how many are needed, the header still says "Scored", and the eval rows say "Not scored" while showing averages of 80% and 98%.

2. **Explain one low dimension in plain language: blocked.**
   - The names are slugs on the Score tab ("mcp_task_completion", "multi_turn_mcp_use") and title-cased slugs on the run page ("Mcp Task Completion").
   - The only explanation is judge rationale full of internal terms, such as "anchor_score" and "proposed_unexecuted_count". The Profile tab's "Why this profile" shows "max_turns>1", "typed_tool", and a stray "</rationale>" tag.
   - The first plain-language account appeared only after generating advice in Improve, and that still names tools like create_workflow.

3. **Find what to do next on Review or Block: completed with help.**
   - Neither the Score tab nor the run page points to Improve; it was found by trying tabs.
   - The Improve empty state says "Generate advice after this agent has a completed or partial score", but this agent already has a "Complete" run.
   - After clicking "Generate advice", the button changed to "Generating…" while "No advice yet" stayed on screen. After about 70 seconds, results appeared without a reload, marked "succeeded" with "high" and "medium" priorities.
   - The trace and span IDs inside the advice are plain text, not links.

## Findings

| Severity | Job and screen | What happened (observed) | Why it matters to that user | Change | Effort |
|---|---|---|---|---|---|
| Major | Job 2.1, 1.2: Home, My Agents, run page, Score tab, Settings, Profile | The 55–69 band is called "Needs work", "Review", and "Review required" on different screens; below 55 it is "Don't ship (recommended)" or "Block recommended". The run Home lists as "Ship with note" (82.4) shows a "Ship" badge on My Agents. | The tester's only question is "can we ship?", and two screens give different answers for the same run. | Render every verdict pill and label from one mapping, using the Profile tab's five names ("Ship", "Ship with note", "Review required", "Block recommended", "Block"), on Home, My Agents, the Score tab, the run page, and Settings → Verdict thresholds. | Small |
| Major | Job 1.2–1.3: run page "Evaluation breakdown" vs Score tab | The same evaluation shows "Needs attention / Target: Not provided" on the run page and "Fail · ≥ 70" on the Score tab. | The engineer can't tell what bar was missed or whether the two screens agree. | Fill the run page "Target" column with the profile threshold ("≥ 70"), and use the Score tab's "Pass"/"Fail" wording in its "Result" column. | Small |
| Major | Job 1.3: run page → trace view | The per-interaction panel opens off-screen; trace IDs are styled as plain text; the trace opens on root span "agent.execute" with no mark on the spans that were at fault. Evidence IDs aren't exposed to keyboard users. | The weak score can't be traced to the tool call behind it, which is the core debugging step. | Render trace and evidence IDs as links. When a trace is opened from an evaluation, open the "Score details" view with that evaluation expanded and its evidence spans highlighted in the span list. | Medium |
| Major | Job 1.2, 2.2: run page, Score tab | Step Efficiency shows "0% · Needs attention" and counts toward the score. Only the generated advice says this comes from null tool input and output in the traces. | The number looks like agent failure when it is a capture problem, so both users act on a wrong signal. | When an evaluation's results include "results lacked evidence", show the count on its row ("3 of 14 had no tool input/output in the trace") with a link to the affected traces. | Medium |
| Major | Job 2.2: Score tab, run page | Evaluation names are slugs ("mcp_task_completion"), and the only explanation is judge text ("anchor_score 0.0… residual_hundredths"). | A tester can't explain a low dimension without learning the system's internals. | Use the display names everywhere (the Score tab currently shows slugs). Under each name, add one plain sentence saying what it checks, and move the raw rationale behind a "Scoring details" toggle. | Medium |
| Major | Job 1.1: My Agents → "Connect an agent" dialog | Keys are masked, the snippet says "<tk_your_key>", the dialog can't create a key or link to one, and nothing shows whether a trace arrived. | A new engineer can't finish setup or confirm it worked without leaving the dialog and searching Integrations. | In step 2, add a "Create key" button that puts the new key into the step 3 snippet. Add a step 5 that shows the selected key's "Last used" value with a "Check again" button. | Medium |
| Major | Job 2.1: run page and Home, "Insufficient sample" | "Scored 25 interactions — too few for a verdict" with no target number. The header says "Scored", rows say "Not scored" next to averages, and "Score stability is available after a scored run completes" appears on a "Complete" run. | 3 of the 10 recent runs on Home are in this state, and the tester can't tell what would produce a verdict. | Replace the line with "25 of N interactions needed for a verdict. Send more traces or widen History window in Settings", and hide the averages while the rows say "Not scored". | Small |
| Major | Job 2.3: Score tab, run page | Neither screen points to Improve on a non-Ship verdict; it was found by trying tabs. | "What do I do next?" has no on-screen answer where the verdict is shown. | When the verdict isn't "Ship", add a "See how to improve" button next to the score ring on the Score tab and in the run page's "Run result" card, linking to Improve. | Small |
| Major | Job 1.4: Settings "Automatic scoring" and Profile "Schedule" | Schedule fields are empty, "Leave blank to inherit the default" never says what the default is, and the same controls exist on two tabs under different names. | The engineer can't see the current schedule, so can't tell whether a change took effect. | Show the inherited value as placeholder text ("Default: N min" / "Default: N days"), and remove the duplicate schedule block from Settings, linking it to the Profile tab instead. | Small |
| Minor | Job 2.3: Improve tab | The empty state says "Generate advice after this agent has a completed or partial score" on an agent with a complete run, and still says "No advice yet" while "Generating…" runs for about 70 seconds. | The tester may think advice isn't available, or that the click did nothing. | Change the empty text to "No advice yet. Generate advice from the latest run." While generating, replace it with "Analyzing the latest run — this takes about a minute." | Small |
| Minor | Job 1.4: Score tab after "Save thresholds" | The save toast was clear, but the Score tab showed no custom-threshold indicator and no next-run time. | The engineer can't confirm from the score itself that the change is pending. | When thresholds are custom, add a "Custom thresholds — apply from next run" chip beside "Scored 2h ago" on the Score tab. | Small |
| Minor | Job 1.1: Home | Home has no way to connect an agent; the header offers only "Take a tour". | A first-session engineer has to guess that connecting starts on My Agents. | Add a "Connect Agent" button to the Home header, opening the same dialog as My Agents. | Small |

## Do this first

1. Use one set of five verdict names on Home, My Agents, the Score tab, the run page, Settings, and the Profile tab, so that "is it safe to ship?" (job 2.1) gets one answer.
2. When a trace is opened from a run-page evaluation, show that evaluation's evidence spans highlighted in the trace view, so the weak score leads to the tool call that caused it (job 1.3).
3. In the "Connect an agent" dialog, add a "Create key" button that fills in the snippet and a "Last used" status with "Check again", so a new engineer can finish setup and confirm traces arrived without leaving the dialog (job 1.1).

# First-session mock audit

5 November 2026. Draft.

This audit checks the [first-session mock](first-session-product-mock.html) against [First session: jobs and workflow](2026-11-05-first-session-jobs-and-workflow.md) and [First-session onboarding](2026-11-04-first-session-onboarding.md). I clicked through it in a browser as the person those docs describe: they already run an agent, they decide whether it ships, and they don't know the words traces, evals, profiles, or instrumentation. For the walkthrough I picked Claude Code and named the agent `support-bot`.

Nothing in the mock or the docs has been changed.

## Top 3

These three are the ones most likely to stop someone before they reach the verdict.

1. **The Allow and approve reminders disappear at the moment they're needed.** The only line that mentions them is at the bottom of the paste step. Most people click I've pasted it right after pasting, before the browser opens. That click closes the window and opens Waiting, and Waiting doesn't mention Allow or the approval. If they miss either one, nothing ever arrives.
2. **Waiting can't tell "not set up" from "not used yet".** The confirm sentence the docs put on this page isn't there. The mock defines it but never shows it, and its text is the old sentence the docs cut. There's also no state for "the setup didn't finish". A broken connection and a working one look exactly the same: Nothing yet, forever.
3. **Nothing brings them back after they leave.** Every waiting state says they can close the page. Nothing says how long 20 real requests usually takes, or that they'll be told when the score is ready. Someone who closes the tab has to remember to check My Agents on their own. Whether we can send a notice is a product question, and the copy should only promise one if it exists.

## All findings, ranked

| Rank | Screen | Finding | Type |
| --- | --- | --- | --- |
| 1 | Connect, paste step, then Waiting | The Allow and approve reminders are gone once they click I've pasted it | Stall |
| 2 | Waiting | No confirm sentence, no "setup didn't finish" state, and no next action when Nothing yet lasts | Stall, missing failure copy |
| 3 | Waiting | No way back once they leave, and no sense of how long it takes | Stall |
| 4 | Connect, paste step | The helper line always says Cursor, even when they picked Claude Code | Wrong guess |
| 5 | Connect, name step | The name field comes filled in with `checkout-agent`, so a quick Continue scores their agent under a sample name | Wrong guess |
| 6 | Connect, paste step | "Copy copies all of this, address included." sits inside the dark paste block, so it reads like part of the paste | Wrong guess |
| 7 | Connect, paste step | Copy keeps saying Copied after they go Back and change the name, so they can paste an old name | Wrong guess |
| 8 | Waiting, ready | Two next actions, and the paste block comes before Read the score | Competing actions |
| 9 | Score | Score now is the most prominent button on the page where the session ends | Competing actions |
| 10 | Score | The three parts are 91, 74, and 68, which average 78, not 82 | Trust |
| 11 | Score | The page says to read the lowest part first, but the lowest part is listed last with no marker | Stall |
| 12 | All | Three words for the same thing: traces, requests, and runs | Vocabulary |
| 13 | My Agents | The row says Active and Just now while the agent has sent nothing | Wrong guess |
| 14 | My Agents | The Tenant, Hosting, External, and Traces columns use words this person doesn't know | Vocabulary |
| 15 | Waiting, writing | The Writing the score chip is orange, which reads as a warning in a normal state | Wrong guess |
| 16 | Home and Welcome | The welcome dialog and the Home card say the same thing twice, and the docs say no tour | Mismatch |
| 17 | Run | "This number is 68" and "This run is the 68 on..." are hard to parse | Vocabulary |

## Screen by screen

### First login (Welcome dialog)

1. **Stalls.** None that block. The three steps go from "Connect" straight to "Use the agent", so the paste, Allow, and approve steps come as a surprise later.
2. **Words.** Fine.
3. **Next action.** Clear: one Connect button. Close (X) lands on Home, which shows the same sentence and another Connect.
4. **Failure.** Not applicable.
5. **Docs.** The onboarding doc says Home's first visit has "one line and Connect" and no tour. The dialog is a short tour on top of that. Keep the dialog or the Home card for the first visit, not both.

### Home

1. **Stalls.** None.
2. **Words.** "Your real-agent health, scoring activity, and next steps in one place." describes a dashboard that doesn't exist yet. "Real-agent health" isn't a phrase this person uses.
3. **Next action.** One card, one Connect. Good. The Integrations icon in the rail also opens Connect, which is fine.
4. **Failure.** Not applicable.
5. **Docs.** Matches.

### Connect: which coding agent

1. **Stalls.** "This is the one that has the project open." Which project? Someone with three windows open has to work out that it means their agent's code. Cursor is preselected, so a Claude Code user can click Continue without noticing.
2. **Words.** "Coding agent" next to "the agent you want scored" is two agents in one window. That's the core idea, but this is where it gets confusing.
3. **Next action.** Clear.
4. **Failure.** If they use a coding agent that isn't listed, there's no way forward. The docs cut Another client on purpose, so the window should at least say what to do.
5. **Docs.** Matches.

### Connect: name

1. **Stalls.** The field comes filled in and selected with `checkout-agent`. Pressing Enter or Continue keeps it. Clearing the field and clicking Continue silently keeps the previous name too. Their real agent ends up scored as `checkout-agent`.
2. **Words.** "What is the agent you want scored called?" is a little awkward. The docs' version, "What do you want to name this agent?", is worse: it sounds like they're naming something new, and the doc itself warns against that.
3. **Next action.** Clear.
4. **Failure.** Nothing tells them the name has to match later. If the confirm sentence uses a different name, the reply says the agent "hasn't sent anything yet", which isn't true.
5. **Docs.** The title differs (see above).

### Connect: paste

1. **Stalls.**
   - "Copy copies all of this, address included." is inside the dark block, in the same font, between the sentence and the address. It looks like part of what they paste, or like an instruction to the coding agent.
   - The helper line says "approve the change Cursor asks for" even after picking Claude Code, because the client name is hardcoded.
   - I've pasted it works before Copy is clicked. That's fine on its own, but it's also the click that takes away the only Allow and approve instructions (Top 3, item 1).
   - Copied stays on after Back, changing the name, and Continue. They'd believe the new name is on their clipboard.
2. **Words.** The paste says "send its traces". The docs changed this to "send what it does" so this person doesn't read the word traces.
3. **Next action.** Copy, then I've pasted it. Clear on its own, but the two steps that happen in other apps are only mentioned in small grey text.
4. **Failure.** There's no copy for the browser not opening, Allow being denied, or the change being rejected. The onboarding doc's line, "Agent Score isn't connected to your coding agent yet. Copy the address, paste it whole, then click Allow.", isn't in the mock.
5. **Docs.** The onboarding doc says this window ends on the Allow line. The mock adds the approve line, which is good, but the client name is wrong.

### Waiting

1. **Stalls.**
   - Nothing yet doesn't mention Allow, the approval, or the confirm sentence. If setup didn't finish, this page sends them off to use the agent, and they come back to Nothing yet with no idea why.
   - "12 of about 20 real requests" appears three times: in the chip, in the body, and under the bar.
   - "Real requests to support-bot" on one line and "from support-bot" on the next. Small, but "to" makes it sound like Agent Score sends requests.
2. **Words.** The title "Waiting for real requests" and "A hello or a made-up request does not count" are both better than the docs' "Waiting for traces" and "A test does not count". The docs should change, not the mock. The body uses a semicolon in a long run-on sentence. Short sentences read better here.
3. **Next action.**
   - Nothing yet, 12 of 20, and writing: one action each, which is good.
   - Can't be scored says "Use it on a real request" but doesn't say to check the connection again, which the docs list as the next action.
   - Ready has two actions. The paste block ("Tell me what support-bot scored, what can be improved, and the next steps.") comes before Read the score, and it's a third prompt. The docs say "No other prompt".
4. **Failure.** Not connected, Allow denied, change rejected, and wrong name all look like Nothing yet. There's no "still nothing?" line and no way back to Connect.
5. **Docs.**
   - The confirm sentence is missing. The mock's `confirmText()` is "Use agent-score to check my agent connection.", the old sentence the docs remove, and it's never shown.
   - Ready has an extra prompt.
   - Writing the score is orange (warning) and Can't be scored is red. The docs don't set tints, but orange reads as a problem in a normal step.

### My Agents

1. **Stalls.** Status says Active and Last active says Just now while the Traces cell says Nothing yet. They'll believe it's working.
2. **Words.** Tenant (`tais`), Hosting (External), and a Traces column. The docs cut the tenant-and-region line for the first visit, and these columns are the same thing.
3. **Next action.** Opening the row is the only action. Good. The row sentence ends with "You can close this page", which makes no sense on My Agents.
4. **Failure.** Can't be scored shows a red chip and the sentence, but no next action besides opening the agent.
5. **Docs.** The docs say My Agents shows the same moments as Waiting. It does, with the leftover "close this page".

### Score (before a score exists)

1. **Stalls.** Six tabs (Improve, Agent Card, Traces, Profile, Labeling, Settings) look clickable. In the product they'd open, and the docs say this visit doesn't use them. Nothing on the page says to wait here.
2. **Words.** Fine.
3. **Next action.** Ask Agent Score is a tonal button next to the waiting message. It competes with "keep using it".
4. **Failure.** Same as Waiting.
5. **Docs.** No Score now before a score, which matches.

### Score (ready)

1. **Stalls.**
   - Score now is the filled blue button, the most prominent thing on the page. It invites a re-score at the point where the session should end in reading.
   - The parts are 91, 74, and 68. Anyone who adds them up gets 78 and wonders where 82 came from.
   - The verdict line says to read the lowest part first, but the list is sorted high to low and the lowest part has no marker.
2. **Words.**
   - "Judged as" here, "Scored as" in both docs.
   - "Tool Caller" is a profile name. It works as the small print under "An agent that answers by using tools."
   - The five-range scale sentence is dense. The reader needs what their verdict means, not all five ranges at the same weight.
3. **Next action.** Three buttons compete (Ask Agent Score, Refresh, Score now), plus three Open the run rows. The run rows should be the obvious next step.
4. **Failure.** Not applicable.
5. **Docs.** Matches apart from "Judged as" and Score now's prominence.

### Run

1. **Stalls.** The back control is the page title with an arrow. There's no "Back to the score" text. The mock's state buttons vanish on this page, which is a mock-only issue.
2. **Words.** "This number is 68" and "This run is the 68 on Stayed inside the refund rule." Run is a third noun after traces and requests.
3. **Next action.** None, which is right because the session ends here. Back is the only way out.
4. **Failure.** Not applicable.
5. **Docs.** Asked, did, answered matches.

## Mismatches between the mock and the docs

Where the mock is better, the right fix is to change the docs.

| Item | Onboarding doc | Jobs doc | Mock | Change |
| --- | --- | --- | --- | --- |
| Name question | What do you want to name this agent? | Same | What is the agent you want scored called? | Both docs, to the rewrite below |
| Connect sentence | send what it does | Not given | send its traces | Mock |
| Confirm sentence on Waiting | Check my agent connection for `<name>`. | Same | Missing; old sentence defined in code | Mock |
| Waiting title | Waiting for traces | Same | Waiting for real requests | Docs |
| What doesn't count | A test does not count | Same | A hello or a made-up request does not count | Docs |
| Leaving | You can leave this page open | Same | You can close this page | Docs |
| Unit of the count | traces, then real runs in the reply | traces | real requests | Docs, and the confirm reply |
| Ready state | One button, Read the score | Same | Verdict prompt plus Read the score | Mock, or add the prompt to the docs on purpose |
| Profile label | Scored as | Same | Judged as | Mock |
| First visit | No tour | No tour | Welcome dialog plus Home card | Pick one |
| Allow line | Click Allow | Click Allow | Click Allow, then approve the change Cursor asks for | Mock: use the client name; docs: add the approve half |

## Rewrites

Placeholders: `<name>` is the agent name they typed, `<client>` is the coding agent they picked.

### Home and Welcome

| Current | Proposed | Why |
| --- | --- | --- |
| Your real-agent health, scoring activity, and next steps in one place. | Score an agent you already run. | The current line describes a dashboard that isn't there on the first visit |
| 1. Connect the coding agent you already use. | 1. Paste one message into the coding agent you already use. It does the setup. | Says what they'll actually do, so the paste doesn't surprise them |
| 2. Use the agent you already run, the way you already do. | 2. Use your agent the way you already do. About 20 real requests gets a score. | Sets the expectation for the wait up front |
| 3. Come back to read its score and verdict. | 3. Come back to read its score and whether it can ship. | "Verdict" is our word, "whether it can ship" is theirs |

### Connect window

| Current | Proposed | Why |
| --- | --- | --- |
| This is the one that has the project open. | Pick the one that has your agent's code open. | "The project" is undefined. This ties it to their agent |
| (nothing for an unlisted tool) | Using something else? Agent Score works with these four for now. | Gives a stopping point instead of a dead end. Wording depends on what we can offer |
| What is the agent you want scored called? | What do you call the agent you want scored? | Plainer, and it doesn't suggest naming something new |
| Use the name of the agent you already run. This is the name on the score. | Use the name you already call it. You'll see it on the score, and you'll use it once more to check the connection. | Explains why the name has to stay the same |
| Field value: checkout-agent | Empty, placeholder: For example, checkout-agent. Continue stays off until there's a name | A filled-in default gets accepted without reading |
| Set this agent up to send its traces to Agent Score. Name it `<name>`. | Set this agent up to send what it does to Agent Score. Name it `<name>`. | Matches the docs and keeps "traces" off the screen |
| Copy copies all of this, address included. (inside the block) | Move it above the block as plain text: Copy takes the whole message, address included. | Inside the block it reads like part of the paste |
| When the browser opens, click Allow, then approve the change Cursor asks for. | Then two things happen outside this page. Your browser asks you to Allow. Then `<client>` asks to make one change. Approve both. | Uses the client they picked and makes both steps visible |
| Copied (stays after the name changes) | Go back to Copy whenever the name changes | Stops them from pasting an old name |

### Waiting

Add a "Finish setup" block above the status on Nothing yet. It stays until something arrives.

| Current | Proposed | Why |
| --- | --- | --- |
| (not shown) | Finish setup in `<client>`: 1. In your browser, click Allow. 2. In `<client>`, approve "Connect `<name>` to Agent Score". 3. Restart `<name>` if it was running, then use it once on a real request. 4. Paste this into `<client>`: Check my agent connection for `<name>`. [Copy] | Brings back the steps the window took away and adds the confirm sentence the docs put here |
| Nothing from `<name>` yet. Restart `<name>` if it was running, then use it the way you already do. A score needs about 20 real requests to `<name>`. A hello or a made-up request does not count. You can close this page; the score will be on `<name>` in My Agents. | Nothing from `<name>` yet. A score needs about 20 real requests. A hello or a made-up request doesn't count. You can close this page. The score will be on `<name>` in My Agents. | Shorter now that the steps are listed above. No semicolon, and "to" is gone |
| (after a while with nothing) | Still nothing? If your browser never asked you to Allow, or `<client>` didn't ask to make a change, connect again. [Connect again] | One next action covers Allow denied, change rejected, and not connected |
| 12 of about 20 real requests to `<name>`. Keep using it... | 12 of about 20 real requests from `<name>`. Keep using it the way you already do. You can close this page. | "From", not "to". Show the count once, in the body and the bar, not also in the chip |
| Something arrived from `<name>`, and none of it can be scored. A hello or a made-up request does not count. Use it on a real request. | Something arrived from `<name>`, but none of it can be scored. A hello or a made-up request doesn't count. Use it on a real request, then check the connection again. | Adds the next action the docs list |
| (no return trigger) | The score usually takes `<typical time>` of normal use. We'll email you when it's ready. | Only if both are true. Without some return trigger, closing the tab is where people drop off |
| Ready: paste block, then Read the score | Ready: Read the score first. Move the "tell me what to improve" prompt to the bottom of the Score page, or cut it | One next action, and it's the one the session needs |
| Writing the score (orange chip) | Same text, neutral or blue chip | Orange reads as a problem in a normal step |

### My Agents

| Current | Proposed | Why |
| --- | --- | --- |
| Status: Active, Last active: Just now (while nothing has arrived) | Status: Waiting. Last active: blank until something arrives | Says what's true |
| Columns: Tenant, Hosting, Traces | First visit: Agent, Status, Real requests, Score | Drops words this person doesn't know |
| ...You can close this page. (in the row) | Drop it on this page | It belongs to Waiting |
| Traces cell when ready: 24 | 24 real requests | A bare number with no unit |

### Score

| Current | Proposed | Why |
| --- | --- | --- |
| Score now (filled, primary) | Outlined, or hidden on the first visit | The session ends in reading. The loudest button shouldn't start a new score |
| Ship is 85 to 100. Ship with note is 70 to 84. ... | Ship with note means it can ship. Read the lowest part first. Then the five ranges in small print | Lead with what their verdict means |
| Judged as | Scored as | Matches both docs |
| Three parts of the 82 / Open one to see the request behind it. | Three parts of the 82, lowest first / Open one to see a real request behind it. | Puts the part the verdict points to at the top |
| Rows: 91, 74, 68 | Sort low to high and mark the lowest. Pick numbers that reach 82, or show the weights | The math has to add up for someone deciding whether to ship |
| Open the run | See the request | One noun across the product |

### Run

| Current | Proposed | Why |
| --- | --- | --- |
| This number is 68 | Scored 68 | Shorter, and it says what the number is |
| This run is the 68 on Stayed inside the refund rule. The agent promised a refund the order did not qualify for. | This request is why Stayed inside the refund rule scored 68. The agent promised a refund the order didn't qualify for. | Drops "run" and says how the request connects to the number |
| ← Stayed inside the refund rule (title as back button) | Add a text link: Back to the score | Makes the way out obvious |

## Vocabulary

The screens use traces, real requests, and runs for the same thing. Use **real requests** everywhere a person reads it: the waiting states, My Agents, Score, Run, and the coding agent's confirm reply ("The score appears after about 20 real requests"). Keep "traces" in code and in the instructions the coding agent reads.

## Mock-only issues

These affect user testing with the mock, not the design.

- Copy doesn't write to the clipboard. It only changes the label. Someone testing it for real will paste nothing.
- The state buttons in the black bar disappear on the Run page.
- The tabs on the agent page do nothing.

## Open questions

- Can Agent Score tell "setup never finished" apart from "connected, nothing used yet"? If it can, Nothing yet should split into two states instead of relying on "Still nothing?".
- What's a typical time to 20 real requests, and can we email when the score is ready? The fix for Top 3, item 3, depends on both.
- Is the "tell me what to improve" prompt on the ready state meant to be part of this session? The docs say no other prompt.
- What should someone do if their coding agent isn't one of the four?

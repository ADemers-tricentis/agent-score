# Building a test set: three places

A redesign of the benchmark flow in `agentscore-benchmark-screens-va01.md`. That version walks the expert through seven pages, and four of them (pick a run, label what happened, label what it should have done, review the test) repeat for every test. With 20 tests that is about 80 page visits. This version groups the same work into three places. The clickable version is `agentscore-benchmark-workspace-va01.html`. The old files are unchanged.

The person on screen is a semi- or non-technical domain expert, here an SAP business user. Screens use plain words: a trace is a "run," a task is a "test," the benchmark dataset is a "test set," and the dev and held-out splits are the "practice set" and "exam set." Setup work for the user's own agent shows up as to-dos and a folded "Technical details" section.

The VA01 blocked-customer run and its IDs are real (from `agentscore-benchmark-workflow.md`). Everything else on screen is tagged **example** in the HTML.

## What changed from the seven-page version

| Before | Now |
|---|---|
| 1 Start a test set, 2 Choose the tasks, 3 Pick real runs | **Plan** (one page, once per test set) |
| 4 Label what happened, 5 Label what it should have done, 6 Review the test | **Review queue** (one workspace, "Save and next") |
| 7 The test set fills up | **Test set** (the page the expert comes back to; also holds the plain-language test and batch approval) |

Why: the unit of work is one test, so it should be a queue and not a wizard. What happened, what should have happened and is this test right are one judgment, so they sit in one view. Planning, doing and managing are different jobs, so they are separate places.

---

## 1. Plan

- **Page:** new. Test sets tab, New test set.
- **What's happening:** the expert wants a fixed set of tests to run before every release. They choose where tests come from, check the tasks AgentScore found, and start reviewing.

**On screen**

- **Intro:** "A test set is a list of real tasks, each with a known right answer. AgentScore has your agent do them and checks the results, so you can tell whether it does your work correctly and whether a new release made it better or worse."
- **Where should tests come from?** Left card.
  - Your agent's own recorded runs: "Real requests your agent has already handled. AgentScore picks a mix of runs that went well, went wrong, and were unusual, so the tests reflect your actual work, including the hard cases."
  - Published tests from your industry: "Public test sets that researchers built for similar work, so you can compare your agent to a known standard. We found sets for desktop, browser and Salesforce work (OSWorld, WindowsAgentArena, WebArena, WorkArena, CRMArena). None covers SAP sales orders, so none are used here and those tests come from your own runs."
  - Generated variations of your tasks: "Changed copies of a real task (different customer, product or amount), added only when a task has too few real runs to test properly. They are capped at 1 in 4 tests, never used in the exam, and nothing is included until you approve it."
  - **Defaults line:** "Checks each release · 20 tests to start · each test runs 3 times. Change in settings." Purpose, size and trials are defaults, not questions.
- **Tasks this agent does:** right card. A short table (task, share of runs, tests, where the tests come from) with **+ Add a task the list missed**. Shares and counts are examples.
- **Cost:** not asked here. "You set a spending limit when you run the test set, with an estimate in front of you."

**Action:** Start reviewing 20 tests.
**Next:** the Review queue.

**For the PM and designer:** this replaces Start, Choose the tasks and Pick real runs. The task list is the request clusters from workflow step 4, after names, IDs, dates and numbers are stripped. "Add a task the list missed" opens a short form (name, one request, Look for matching runs). If no run matches, the task goes to the queue as a draft from the expert's request (see the third queue item). The "task agent" template is picked from the Agent Card and profile fit, so the expert never sees it.
**Gaps:** a dataset and task store; a catalog of published benchmarks.

---

## 2. Review queue

- **Page:** the existing Labeling tab, extended. Questions about fault and kind of mistake are new, and the four "should have" questions replace the 200-character Expected outcome box.
- **What's happening:** every candidate test, whether a real run, a generated variation, or a draft from the expert's own request, sits in one queue. The expert opens one, says what happened and what should have happened, and moves on.

**Layout (three columns)**

- **Left, the queue:** the test set name, "8 of 20 reviewed" with a progress bar, then items grouped by task. Each item shows a source tag (Your run, Generated, Draft from your request) and a status. A reviewed item shows a tick and "Reviewed."
- **Middle, the evidence** for the open item.
- **Right, the expert's judgment**, with **Save and next** at the bottom.

**The three item types**

1. **A real run** (example: Sales order for a blocked customer, went wrong).
   - Middle: what the agent was asked, and what it did in six steps. Steps with evidence have "See what the agent saw and did." "View full run" opens the Traces tab. A note says "5 similar runs are grouped into this one," with a link "Are these the same situation?" to the group view (same or split out).
   - Right: Did the agent do the right thing? (No.) What went wrong and whose fault was it? Each row has an **AI guess** (the agent's mistake with kinds Repeated the same step and Missed a warning or error; a system problem with kind Nobody answered in time). What should it have done? Four questions tagged **AI draft** and editable in place: what should be true at the end, what should the agent do, what must it never do, and what would you say if it asks for help. An optional note, "Anything else?"
   - Button: **Save and next**.
2. **A generated variation** (example: House bank, IBAN left blank).
   - Middle: a side-by-side of **From your real run** and **Draft** with the changed words highlighted, and "Could this really happen? Approve it only if it could." The reference path is folded under "One way to do it (4 steps)."
   - Right: A correct result, It must, and It must never, each line editable in place.
   - Buttons: **Approve and next**, and a quiet **Reject** link. Edits tag the draft "Edited by you," and the ready check runs again on the edited version.
3. **A draft from the expert's request** (example: Change a customer's payment terms, no runs matched).
   - Middle: the request (editable), and the card "Tests from your request are for practice": "Nothing real backs them, so they are not used to judge a release. Each one is marked 'Draft from your request', and you approve it first. This task has no judged tests yet. After your agent has run it, you can add a real run." Also "No published test set covers this task" and **Reword the request**.
   - Right: **What a correct run looks like**, tagged AI draft: a table of Step, Expected result and **Counts as** (**Context** or **Must**; the last step is the **Final check**). A vague expected result such as "Order saved." is flagged **Too vague** with a prompt to add the value to look for. **+ Also test with a shorter request** makes a second test. A checkbox, "I checked the steps marked Must," has to be ticked before **Approve and next** unlocks.

**Rules the queue follows**

- The agent never sees the steps. It only gets the request and, if it asks for help, the prepared reply. The steps and the pass rules stay in AgentScore.
- A run that went wrong contains wrong steps. The expert's answers to "what should it have done" define what is right, so a step table lists only the steps the expert keeps.
- Values a step stores for later (for example sales order, delivery and billing numbers) are found by searching for a reference AgentScore adds to the test's records. Your agent's test setup has to set it. This is a to-do for your agent.
- The first 10 labels hide AI guesses until the expert answers, so those labels can later be used to measure how well the automatic checks agree with the expert.
- Free-text notes are read by an LLM when the expert finishes and filed as kinds or to-dos. They never change a label or a score. They apply the same name, number and password masking as the evidence view.

**Action:** Save and next (or Approve and next, or Reject).
**Next:** the next item in the queue. When none are left, a link goes to the test set.

**For the PM and designer:** the real-run item is today's Labeling tab plus the new fault and kind questions and the four "should have" questions. The answers map onto the task: question 1 becomes the end-state checks, 2 the judge criteria, 3 the forbidden actions, and 4 the simulated operator. The "Whose fault" step is failure triage (workflow step 5): an LLM guesses, and the expert confirms a 20% sample with at least 90% agreement. System problems never count against the agent. Kinds line up with checks: repeated the same step with `no_retry_loop`, changed something it shouldn't with the forbidden actions, didn't ask with `escalate-once`, and system kinds with `invalid_if`. Generated variations are step 11's gap fill: a grid cell with too few real runs gets an LLM rewrite of a real task, with at most 25% of the set, never held-out, a reference solution that passes, and the expert rejecting anything unrealistic.
**Open decisions:** whether request-only drafts sit outside the 1 in 4 cap (the card is silent on it for now); whether an edited draft needs fresh approval (this mock assumes it stays approved but goes back through the ready check).
**Gaps:** a dataset and task store; error categories; per-task criteria the judge can see; a simulated-operator hook for `ask_human`; a link from each summary step to its source span.

---

## 3. Test set

- **Page:** new. The test set's home, the page the expert comes back to.
- **What's happening:** every test and its status, what the set covers and misses, and what is left to set up. Tests are approved here in a batch.

**On screen**

- **Header:** testcase.generate pilot, "Checks each release · each test runs 3 times," with **Approve 12 ready tests** and **Run test set**. Run stays unavailable until setup is done.
- **Four numbers:** Tests (20 planned, 8 reviewed), Approved, Ready to run (and how many are waiting on setup), Practice and exam (14 / 6; "The exam stays hidden from whoever tunes the agent.").
- **Tests table:** test, task, source, set (practice or exam) and status (Needs review, Waiting for your approval, Approved waiting on setup, Ready). **Approve 12 ready tests** moves the waiting ones to "Approved, waiting on setup."
- **Opening a row** shows the test in plain language:
  - The agent is asked to: the request with test-data placeholders. "Real customer names, numbers and passwords are swapped for test data. Your agent only sees this request and the reply below. The pass rules stay in AgentScore."
  - If it asks for help, AgentScore answers: the reply from the queue.
  - Doesn't count either way if: SAP can't be reached, the test system connection is down, or the test data couldn't be set up. We run it again instead.
  - It passes only if all of these are true: no order saved, customer still blocked, asks once and stops, never unblocks, no more than two Ship-To retries, and completes the steps before the block. How fast it gets there is reported but doesn't decide pass or fail.
  - How it's filed: task, category, difficulty and risk, kinds of mistake it checks.
  - Is it ready? Works when done right (a recorded correct run passed 3 of 3 on 12 Nov 2026), no real customer data, and a clarity check across the other tests. Practice set, locked, because the run was already used in the workbook.
  - Technical details (folded): test ID `tcg-va01-blocked-customer-001`, source trace, environment, snapshot, seed, harness and tool-log checks, evals, invalid-if conditions.
- **Coverage by task:** bars of reviewed against planned tests.
- **Kinds of mistake covered:** counts per kind, with a "Find runs" button on kinds that have none, such as "Gave up too early."
- **To do before your agent can run this:** set up the blocked test customer and test material in the SAP test system, and connect the checks that look inside SAP after each run. After approval a test shows "Approved, waiting on setup" and becomes Ready when both are done.

**Action:** Approve ready tests, then Run test set.
**Next:** a run, with a spending limit and cost estimate asked for at that moment.

**For the PM and designer:** this replaces "The test set fills up" and the old Review the test page. The SAP checks run in the customer's harness and come back as eval scores joined on `benchmark.task_id`, not as a new AgentScore judge. The `escalate-once` eval still has to be written, and it can't block a release until it agrees with the expert (κ of 0.7 or better across 45 labels).
**Gaps:** a dataset and task store; harness state-assertion results ingested as eval scores.

---

## Not carried over

- The side panel "The test so far" from the seven-page mock. The queue's progress and the test set table replace it.
- The "Look for matching runs" form, the generated drafts card with Approve, Edit and Reject, and the no-match state. They are folded into the Plan page's "Add a task the list missed" and the three queue item types.

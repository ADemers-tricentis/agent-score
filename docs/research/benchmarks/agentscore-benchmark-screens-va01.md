# Turning a stuck run into a test: one VA01 task, seven steps

A design mock of labeling and building a benchmark test set in AgentScore, following one run of `testcase.generate` (tenant `tais`, profile "Tricentis ATA" v1) until it becomes test `tcg-va01-blocked-customer-001`. The clickable version is `agentscore-benchmark-screens-va01.html`. The steps follow `agentscore-benchmark-workflow.md`.

The person on screen is a semi- or non-technical domain expert, here an SAP business user. Screens use plain words: a trace is a "run," a task is a "test," the benchmark dataset is a "test set," and the dev and held-out splits are the "practice set" and "exam set." Setup work for the user's own agent shows up as to-dos and a folded "Technical details" section. Each step ends with a note for the PM and designer that maps the plain wording back to product terms and names the gap from "What AgentScore would need to build."

The test set is built task by task. AgentScore finds the jobs the agent does, plans how many tests each one gets, and fills each with real runs, published tests, or generated variations of real tasks.

The user's own agent runs the finished tests. It receives only each test's request and the prepared reply if it asks for help. What counts as a pass, what it must never do and the exam tests stay in AgentScore, and the checks inside the customer's system run outside the agent, so the agent can't read the answer key or grade itself.

Errors are categorized twice. Whose fault it was (the agent, the system, or the instructions) decides whether a failure counts. What kind of mistake it was (for example repeated the same step, or missed a warning or error) is guessed by AgentScore and confirmed by the expert while labeling. The kind is then used to filter run suggestions, file the test, show which kinds the set doesn't cover yet, and break down results.

The VA01 run, its IDs and every number in the workflow doc are real. Everything else on screen is tagged **example** in the HTML: other tasks, shares of runs, per-task counts, other suggestions, queue progress and the other rows in the test set. It's there so the screens look lived in, and it isn't a second scenario.

| # | Step | In AgentScore today? | Who |
|---|---|---|---|
| 1 | Start a test set | New page (Test sets tab) | SAP expert |
| 2 | Choose the tasks to test | New page | SAP expert |
| 3 | Pick real runs for each task | New page | SAP expert, AgentScore spot-checks groups |
| 4 | Label it: what happened? | Labeling tab today, plus two new questions | SAP expert |
| 5 | Label it: what should it have done? | Labeling tab today; the 200-character box is replaced | SAP expert |
| 6 | Review the test | New page | SAP expert approves, your agent gets to-dos |
| 7 | The test set fills up | New page | SAP expert and team |

A panel beside every screen, "The test so far," shows the test's ID, its source run `5cb1fcc44fa472fa7b10beb95fe03387`, and each field as it's filled in.

---

## 1. Start a test set

- **Page:** new. A **Test sets** tab on the agent. It opens on the list of existing test sets, with a **New test set** button. Pressing the button opens the form below.
- **What's happening:** the expert wants a fixed set of tests to run before every release. They answer one question, where the tests should come from, and AgentScore sets up the rest.

**On screen: the list of test sets**

- **Header:** Test sets. "Fixed lists of tests you run against this agent. Start a new one, or open one you already have." **New test set** button.
- **Table** (rows are examples): test set, used for, number of tests, last run, result. Release check v2, 80 tests, passed 74 of 80 · Nightly smoke, 25 tests, passed 21 of 25 · Model comparison, 150 tests, draft, 112 of 150 ready. Opening a row goes to that test set's overview (screen 7).
- **Empty state:** with no test sets yet, only the New test set button shows.

**On screen: the New test set form**

- **Intro:** "A test set is a list of real tasks, each with a known right answer. AgentScore has your agent do them and checks the results, so you can tell whether it does your work correctly and whether a new release made it better or worse."

- **Where should tests come from?**
  - Your agent's own recorded runs: "Real requests your agent has already handled. AgentScore picks a mix of runs that went well, went wrong, and were unusual, so the tests reflect your actual work, including the hard cases."
  - Published tests from your industry: "Public test sets that researchers built for similar work, so you can compare your agent to a known standard. We found sets for desktop, browser and Salesforce work (OSWorld, WindowsAgentArena, WebArena, WorkArena, CRMArena). None covers SAP sales orders, so none are used here and every test comes from your own runs."
  - Generated variations of your tasks: "Changed copies of a real task (different customer, product or amount), added only when a task has too few real runs to test properly. They are capped at 1 in 4 tests, never used in the exam, and nothing is included until you approve it."

- **Defaults line:** "Checks each release · 20 tests to start · each test runs 3 times. Change in settings." Purpose, size and trials are defaults, not questions. The expert can change them later.

**Action:** Create test set.
**Next:** AgentScore lists the tasks the agent does.

**For the PM and designer:** this is the benchmark spec (workflow steps 2 and 3), with use, size and trials set as defaults. The spending limit is not asked here: it is set when the expert runs the test set, with a cost estimate in front of them. AgentScore picks the "task agent" template from the Agent Card and profile fit, so the expert never sees it.
**Gaps:** a dataset and task store; a catalog of published benchmarks.

---

## 2. Choose the tasks to test

- **Page:** new. The test set's plan.
- **What's happening:** AgentScore groups the requests in the agent's runs into the jobs it actually does. The expert checks the list. AgentScore plans how many tests each task gets and where each test will come from.

**On screen**

- **Header:** Tasks this agent does. "Found by grouping the requests in the agent's runs · 20 tests planned · names and numbers in requests hidden."
- **Task plan** (shares and counts are examples):

| Task | Share of runs | Tests | Went fine | Went wrong | Unusual | Tests come from |
|---|---|---|---|---|---|---|
| **Create a sales order** (SAP VA01) | 41% | 8 | 4 of 4 | 3 of 3, including the blocked customer | 1 of 1 | 8 from your runs. No published set covers SAP sales orders. |
| Change a house bank account (SAP FI12) | 18% | 4 | 2 of 2 | 1 of 1 | 0 runs · **Generate 1** | 3 from your runs, 1 to generate |
| Get a car insurance quote (web app) | 23% | 4 | 2 of 2 | 0 mistakes (only outages) · **Generate 1** harder version | 1 of 1 | 3 from your runs, 1 to generate |
| Opportunities, leads and cases (Salesforce) | 18% | 4 | 1 of 1 | 1 of 1 | 2 published | 2 from your runs, 2 from CRMArena |

- **+ Add a task the list missed.** Opens an "Add a task" card under the table:
  - **What is the task called?** "Change a customer's payment terms" (example).
  - **Write one request for it, the way a user would ask.** "Names and numbers are hidden before AgentScore uses it."
  - **Look for matching runs** searches the agent's runs. The result (example) says "6 runs look like this task," about 1% of runs, 4 went fine, 1 went wrong, 1 unusual, reviewed in the next step like the other tasks. It also says no published test set covers it.
  - **When no runs match:** the result card says "No runs look like this task. Your agent hasn't done this yet, or it words it differently. Try rewording the request, or build tests from your request instead." It also says no published test set covers it, and that tests from the request are for practice: "Nothing real backs them, so they are not used to judge a release. Each one is marked 'Draft from your request', and you approve it first. This task has no judged tests yet. After your agent has run it, you can add a real run." Buttons: **Cancel**, **Reword the request** (returns to the request box), and **Generate drafts from my request** (opens Generated drafts). **Add to the plan** stays unavailable until at least one draft is approved, so a task never sits in the plan with no tests behind it.
  - **Few matches (open question):** with only one or two matching runs, show the normal card plus a warning that tests for this task may be thin, with generated drafts as an option.
  - **How many tests for this task?** 2. **Add to the plan** puts the task in the list. **Cancel** closes the card.
- **Generate** opens a "Generated drafts" card, and each draft needs the expert's review. Each draft shows what the agent is asked, what a correct result looks like, and a collapsed example path. Without the expected outcome the expert would be approving a title, because a draft has no real run behind it.
  - "Change a house bank account, IBAN left blank." Made from a real FI12 run by dropping a field. Practice only.
    - **Request:** "Change the IBAN on the house bank account for bank key [bank] and leave the IBAN blank."
    - **A correct result:** nothing is saved, and the agent tells the user the IBAN is missing. **It must:** report the missing IBAN and stop. **It must never:** make up an IBAN, or save without one.
    - **One way to do it** (collapsed): open FI12, select the house bank and account, clear the IBAN, save and read the error, tell the user. An example path, not the only correct one.
  - "Car insurance quote for a driver under 18." Made by changing one value the site should refuse. Practice only, and dropped if the agent passes it 3 of 3 with no effort.
    - **Request:** "Get me a car insurance quote for a driver aged 17."
    - **A correct result:** the site refuses to quote, and the agent tells the user why. **It must:** report the refusal. **It must never:** change the age to get a quote.
    - **One way to do it** (collapsed): open the quote form, enter age 17, submit, read the refusal, tell the user.
- **What the expert does with each draft** (three buttons per draft):
  - **Approve:** the draft joins the plan for that task, the Generated count goes up, and the draft shows "Approved · added to the plan". It still goes through the ready check on its own test page (screen 6), like any other test.
  - **Edit:** the request and the correct result become editable (request, correct result, It must, It must never). **Done editing** saves it and tags the draft "Edited by you". The ready check runs again on the edited version, because the earlier correct run proved the old wording, not the new one. Editing an approved draft keeps it approved and sends it back through that check.
  - **Reject:** the draft is dimmed and its slot is freed (the Generated count drops if it was approved). The expert can **Undo** or **Generate another**. An optional reason, such as "Couldn't happen", would help AgentScore learn what unrealistic means for this agent (not drawn in the mock).
  - Open question: whether an edited draft has to be re-approved. The doc assumes it goes back through the ready check but stays approved for the plan.
- **Totals:** 16 from your runs · 2 published (CRMArena, still needing this customer's test data and checks) · 2 generated of 5 allowed. "No more than 1 in 4 tests, never in the exam."

**Action:** Find runs for these tasks.
**Next:** run suggestions, starting with sales orders, the task that runs most.

**For the PM and designer:** the task list is the request clusters from workflow step 4, after names, IDs, dates and numbers are stripped. Tests per task follow how often each task happens in production. Published items come from step 2 and still need this customer's seed and graders. Generate is step 11's gap fill: a grid cell with too few real runs gets an LLM rewrite of a real task (reword it, drop a field, switch to German shorthand). Its rules come from the doc: at most 25% of the set, never held-out, each with its own seed and a reference solution that passes, and the expert rejects anything unrealistic.
**Gaps:** a dataset and task store; a catalog of published benchmarks.

---

## 3. Pick real runs for each task

- **Page:** new. The test set's suggestions.
- **What's happening:** for every task in the plan, AgentScore suggests recent runs worth turning into tests, and groups near-identical runs so the expert reviews each situation once.

**On screen**

- **Header:** testcase.generate pilot, 0 of 20 tests, pool target 60 runs.
- **Tests per task:** Create a sales order (VA01) 0 of 8 · House bank (FI12) 0 of 4 · Car insurance quote 0 of 4 · Salesforce 0 of 4.
- **A good test set has a mix:** an aim bar (about half went fine, a third went wrong, a fifth unusual) and a "suggested so far" bar.
- **Filter:** Went fine 24 · **Went wrong 21** · Unusual 9 (counts are examples).
- **By kind of mistake** (within Went wrong; counts are examples): All 21 · Repeated the same step 5 · Missed a warning or error 4 · Used the wrong record 3 · Skipped a step it was told to do 3 · System problems 6, which don't count. "AgentScore guessed the kind from the judges' reasons. You confirm it when you label. A run can have more than one." Each card shows its kinds as tags.
- **Suggestion card:**
  - **Create a sales order in SAP (VA01).** "The customer was blocked. The agent got stuck retrying, asked for help, nobody answered, and the run stopped."
  - Repeated the same step · Missed a warning or error · Task success 50 · Followed instructions 60 · **5 similar runs grouped into this one ▾**.
  - **Opening the group shows "Are these the same situation?"**
    - What they all asked, with names and numbers hidden: "Create a standard sales order (VA01) for [customer], sales org [org]. PO [number] dated [date]. Material [material], qty [number]. Verify pricing, check schedule lines, save, verify the order number."
    - A table of the grouped runs: this run (the kept one, "most detail"), then runs 2 to 4, which differ only in PO and date, quantity, or material, and each ended the same way. Run 5 differs in customer and ended with the order saved, flagged "Ended differently. Check this one."
    - Each row offers **Same** or **Split out**. Splitting run 5 strikes it through, marks it "Now its own suggestion," and the count drops to 4.
    - "Runs you keep stay attached as variations, so the test isn't built from one lucky example. AgentScore spot-checks 20 groups like this one; fewer than 1 in 10 should need splitting."
  - Buttons: Not useful · **Add to labeling**.
- **Other suggestions (examples):**
  - Went wrong:
    - A VA01 order saved without the pricing check, tagged skipped a step.
    - A Salesforce opportunity saved under the wrong account, tagged used the wrong record. Its instructions contain a password, which AgentScore hides.
    - An FI12 house bank change where SAP returned HTTP 502, tagged system down.
    - A car insurance quote where the TBox tunnel was down, tagged connection down.
    - The last two are marked "Likely a system problem," with Skip or Keep as a recovery test.
  - Went fine: a standard VA01 order, an FI12 change, an insurance quote and a Salesforce lead.
  - Unusual: an insurance quote where the agent asked for a missing value, a sales order in German shorthand, co-create mode, and a CRMArena support-case item marked "Published · CRMArena."

**Action:** Add to labeling.
**Next:** the run opens in the Labeling review queue.

**For the PM and designer:** this is harvest and dedup (workflow step 4). Low scorers come from `get_eval_interactions` on scorecard run `01M75YCA77EW1X8BSEFQ7QM35D`. Runs merge at cosine 0.90 or higher with the same tool-sequence signature, and the member with the most evidence is kept. The group view is where the expert sees the merge and AgentScore does the 20-cluster spot-check. Of the 8 lowest task-success scores, 4 were outages, which is why system problems are flagged here before labeling. The kind-of-mistake filter lets the expert spread the "went wrong" share across different kinds instead of picking five copies of one.
**Assumption:** the doc's 5-run cluster is "VA01 ZOR1, sales org SE21, ZSR2 condition = 10" and never names this trace. The mock treats the trace as the kept member.
**Gaps:** a dataset and task store; error categories.

---

## 4. Label it: what happened?

- **Page:** existing Labeling tab. The test-set filter, the queue strip, and the "whose fault" and "what kind" questions are new.
- **What's happening:** the expert reads what the agent did, step by step, and says whether it was right and whose fault anything was.

**On screen**

- **Answer first (proposed):** for the first 10 labels, a banner says "Answer first. Run 8 of your first 10." The scores, the AI guesses and the whose-fault section stay hidden until the expert picks Yes or No. After the first 10 they show up front. This keeps the first labels independent of the automatic checks, so they can later be used to check how well those agree with the expert (workflow step 10). The suggestion cards in step 3 still show scores, so the first 10 are not fully blind for someone who read them there.
- **Header:** Ready for human review · showing runs for test set *testcase.generate pilot* · about 8 min each.
- **Queue strip:** "This week: 7 of 45 labeled · 2 of the 12 'agent got it wrong' labels you need," about 5 hours left (examples). Now: Sales order for a blocked customer (VA01). Next: opportunity under the wrong account, insurance quote asking for a missing value, sales order in German shorthand, + 34 more.
- **What the agent was asked:** "Create a standard sales order in SAP for a customer, check prices and delivery dates, save it, and confirm the order number."
- **What it did:**
  1. Opened the sales order screen and entered the customer.
  2. SAP showed a warning: "has been assigned order block: Overall block."
  3. Re-entered the Ship-To field about 12 times.
  4. Asked a person for help.
  5. Nobody answered for 600 seconds.
  6. The run stopped.
  - **See the evidence behind each step.** Every step has a "See what the agent saw and did" link. It opens the tool call the agent made and what came back, for example the exact SAP warning text, the 12 Ship-To calls and their identical replies, and the 600-second timeout. The raw detail shown is an example, since the doc only records the summary.
  - **View full run** (top right of "What it did") opens the existing Traces tab filtered to this run, with the full context, system prompt and every call. This is for hard cases. The expert doesn't need it for most labels.
  - Names and numbers are hidden in the evidence, the same as in the rest of the pipeline. The plaintext password found in one queued trace has to be masked here too.
- **Did the agent do the right thing?** Yes or No, nothing preselected. Here the expert picks No, and the next section appears.
- **What went wrong, and whose fault was it?** (AgentScore's guesses are preselected and tagged **AI guess**. The expert checks them against the steps and their evidence.) Each row asks whose fault it was, then **What kind?**, with a list that changes with the fault and ends in "+ New kind."
  - Re-entered Ship-To about 12 times: **the agent's mistake**. Kind, pick all that fit: **Repeated the same step**, **Missed a warning or error**. The other choices are used the wrong record, skipped a step it was told to do, changed something it shouldn't, didn't ask when it should have, and gave up too early.
  - Nobody answered for 600 seconds: **a system problem**. Kind: **Nobody answered in time**. The other choices are system down or erroring, connection to the test system down, and test data missing. "In the test, AgentScore will answer for you, so the run can finish."
  - The third fault choice on each row is "Unclear instructions," with the kinds information missing and instructions contradict each other.
- **Anything else about what went wrong?** Optional free-text box (proposed). "Write it your own way. AgentScore reads it when you finish and suggests where it belongs. Please don't paste names, numbers or passwords." Example note: "It should have stopped at the first warning. Also nobody ever answered it. I think the test system's chat isn't hooked up."

**Action:** Next: what should it have done?
**Next:** the second half of the label.

**For the PM and designer:** "Did the agent do the right thing?" is today's Correct / Incorrect choice. "Whose fault" is failure triage (workflow step 5): an LLM guesses, and the expert confirms a 20% sample with at least 90% agreement. System problems never count against the agent. "What kind?" is the error category. The LLM guesses it from the judge's reason, in the same pass as the fault. Several kinds line up with a check: repeated the same step with `no_retry_loop`, changed something it shouldn't with the forbidden actions, didn't ask with `escalate-once`, and the system kinds with `invalid_if`.
The note is saved with the label. When the expert finishes, an LLM reads it and files what it finds (shown on the review screen, step 6). It never changes the label or a score on its own, and it applies the same name, number and password masking as the evidence view. Notes are for review, calibration and to-dos for your agent, not ground truth.
**Gaps:** a dataset and task store; error categories; a link from each summary step to its source span, so the evidence opens in one click.

---

## 5. Label it: what should it have done?

- **Page:** existing Labeling tab. The four questions replace today's Expected outcome box.
- **What's happening:** the expert adds what only they know. The block is intentional test data, so the right move is to notice it, ask once, and stop.

**On screen**

- **Today (shown for comparison):** one Expected outcome box, 200 characters max. "Block is intentional test data. Spot the Overall order block, ask once, report it and stop. Save no order. Never unblock the customer."
- **Proposed.** Questions 1 to 3 are tagged **AI draft**: AgentScore wrote them from the run, and the expert checks and edits each line.
  1. **When it's done right, what should be true at the end?** "A record saved, a setting changed, or an answer that includes the right facts. Say what you would check." Here: no sales order is saved for this customer. The customer is still blocked.
  2. **What should the agent do?** Notice the order block. Ask once, naming the customer and the block. Stop when told to, and report the block.
  3. **What must it never do?** Unblock the customer or change customer master data. Keep making changes after being told to stop. Try the Ship-To field more than [2] times, where 2 is an editable number.
  4. **If the agent asks you for help, what would you say?** Shown only when the agent can ask a person. "That customer is blocked on purpose. Do not change master data. Stop and tell me what you found."
     - **+ Add another answer (makes a second test):** "Use customer [another, unblocked test customer] instead." It passes only if the order is saved for that customer.
  5. **Why?** (optional) The block is intentional test data.
- **What a correct run looks like** (proposed, collapsed by default; example: order to cash, 15 steps, tagged **AI draft**). AgentScore writes the steps from the recorded run, and the expert marks how much each matters. A table of Step, Action, Expected result and **Counts as**. The agent never sees the steps: it only gets the request, and the steps are used to check its work. Questions 1 to 4 are enough for most tests, so the table is only needed for a long task.
  - **Which steps to show.** A run that went wrong contains wrong steps. The expert's answers to questions 1 to 3 define what is right, so the table lists only the steps the expert keeps.
  - **Counts as** has three values. **Must happen:** the run fails without it, however the agent gets there, in any order that works. **Context only:** kept for reading, not checked. **Final check:** the last step's expected result, which becomes question 1 (here: order, delivery, goods issue and billing all Completed).
  - A vague expected result (for example "Order saved." with nothing to check) is flagged so the expert can add the value to look for.
  - **Values carried forward:** a value a step stores for later (sales order, delivery and billing numbers) is found by searching for a reference AgentScore adds to the test's records (here Customer Reference `BENCH-P01-E`), so checks look at the order this run created and not an older one. Your agent's test setup has to set it. This is a to-do for your agent.
  - **+ Also test with a shorter request (makes a second test):** the second test gives the agent only the goal and a few values instead of the full walkthrough, and checks the same things. The less detail the request gives, the harder the test.
  - **Generated drafts and tasks with no matching run:** the table is open by default, every row is tagged AI draft, and the expert must confirm the Must happen steps before "Add to the plan" unlocks. Steps written from the request alone have nothing real behind them, so they carry the most risk.

**This page is generic.** The four questions are the same for every agent type and never mention a particular system. Only the suggested answers change, and AgentScore fills them in from the agent type and Agent Card. SAP is just this example. For a Q&A agent, question 1 reads as "the answer includes the right facts" and question 4 is hidden, since it has nothing to ask. For a browser agent, question 1 might be "the booking is confirmed on the page."

**Action:** Save label.
**Next:** AgentScore drafts the test from the run and the label.

**For the PM and designer:** today Save label calls `submit_label` with the 200-character expected outcome. The answers map onto the task: question 1 becomes the state assertions, 2 the judge criteria, 3 the forbidden actions and process requirements, and 4 the simulated operator. The second answer is the doc's `{CUST_OK}` variant.
**Gaps:** per-task criteria that judges can see; a simulated-operator hook for `ask_human`.

---

## 6. Review the test

- **Page:** new. The test's page in the test set.
- **What's happening:** AgentScore writes the label back as a plain-language test. The expert checks it reads right and approves, and the setup goes to your agent.

**On screen**

- **Title:** Sales order for a blocked customer · Waiting for your approval.
- **The agent is asked to:** create a standard sales order (VA01) for [blocked test customer] in [test sales org], verify Ship-to defaults, PO TEST-PO-001 dated [today], [test material] qty 10 CS, verify pricing and conditions, check schedule lines, save, and verify the order number. "Real customer names, numbers and passwords are swapped for test data. Your agent only sees this request and the reply below. The pass rules stay in AgentScore."
- **If it asks for help, AgentScore answers:** the reply from step 5.
- **From your note** (proposed, example): the expert's step 4 note, then what AgentScore did with it, tagged **AI suggestion**:
  - **Matches a kind you already picked:** missed a warning or error.
  - **Suggested new kind:** "Kept going after a block," with **Add this kind** and **Not now**.
  - **Passed to your agent:** check that the simulated reply to "ask for help" is connected in the test system. It is added to the to-dos below.
  - "Your note is kept with the label. It never changes a label or a score by itself."
- **How it's filed** (proposed):
  - **Task:** Create a sales order (SAP VA01).
  - **Category:** Sales orders › Blocked customer data.
  - **Difficulty and risk:** hard, medium risk.
  - **Detail in the request** (tests with steps only): full walkthrough. A shorter version (goal and key values) is also tested.
  - **Kinds of mistake it checks:** repeated the same step, missed a warning or error, didn't ask when it should have, and changed something it shouldn't. "The first two are what went wrong in the run. The other two come from your 'should' and 'must never' answers."
- **It passes only if all of these are true:**
  - No sales order is saved.
  - The customer is still blocked.
  - It asks once and stops when told.
  - It never unblocks the customer.
  - It doesn't retry Ship-To more than twice.
  - It completes the steps before the block: opens the sales order screen and enters the order type, sales organisation and customer. Skipping pricing, schedule lines and saving is fine. Scored automatically, and it only counts toward pass once the automatic score agrees with the expert's judgment on past runs.
  - Tests with steps (example): it reaches every step marked "Must happen", in any order that works, and the final check holds. Steps marked "Context only" are not checked.
  - "How fast it gets there is reported but doesn't decide pass or fail."
- **Doesn't count either way if:** SAP can't be reached, the test system connection is down, or the test data couldn't be set up. "We run it again instead."
- **Is it ready?**
  - Works when done right: a recorded correct run passed 3 of 3 times on 12 Nov 2026.
  - No real customer data.
  - Clear enough?: a reviewer checks whether it could be read two ways, with the other tests.
- **Practice set or exam set?** Practice set, locked. "Your team already used this run in the testcase-generate workbook (scenario P02), so it can't be a surprise."
- **To do before your agent can run this** (open to-dos, not ticks; after approval the test shows "Approved, waiting on setup" and becomes Ready when both are done): set up the blocked test customer and test material in the SAP test system; connect the checks that look inside SAP after each run.
- **Technical details** (folded): test ID `tcg-va01-blocked-customer-001` v1.0.0; source trace; environment `sap-sandbox-s4-2026q4`, snapshot `snap-2026-11-12-anon`, seed `seeds/va01_blocked_customer.py`; the harness checks `no_order` and `block_intact`; the tool-log checks `edit_master` (XD02, VD02, XD05, VD05), `write_after_stop`, `no_retry_loop` and `escalates`; the AgentScore evals `escalate-once` (100) and `prompt-compliance` (60); invalid if HTTP 5xx, TBox tunnel down or seed verify fails; operator timeout 30 s.

**Action:** Approve and add to test set.
**Next:** the test appears in the test set as "Approved, waiting on setup", and becomes Ready when the setup is done.

**For the PM and designer:** this is the section 4 task JSON (workflow steps 7, 8, 9 and 12) as a readable summary. The SAP checks run in the customer's harness and come back as eval scores joined on `benchmark.task_id`, not as a new AgentScore judge. The `escalate-once` eval still has to be written (the user's agent can do it with AgentScore's tools), and it can't block a release until it agrees with the expert (κ ≥ 0.7 across the 45 labels).
The category, difficulty and risk are the task JSON's `metadata`, and the kinds are its `error_categories`.
**Gaps:** a dataset and task store; harness state-assertion results ingested as eval scores; per-task criteria that judges can see; a simulated-operator hook for `ask_human`; error categories.

---

## 7. The test set fills up

- **Page:** new. The test set's overview.
- **What's happening:** the expert and team see how far along the set is, what kinds of runs it still needs, and how far along each task is.

**On screen**

- **Header:** testcase.generate pilot · check each release · each test runs 3 times · **Give tests to your agent** (disabled until 20 tests are ready). When pressed, it asks for the spending limit with an estimate: "This will run 20 tests 3 times, about $45 at typical cost (one run of this agent costs about $0.72 on a typical task). Limit this run to $45?"
- **Give these tests to your agent** (proposed): a card with a copyable instruction ("Run every test in the "testcase.generate pilot" test set from AgentScore, 3 times each...") and three states: Not given yet, Running (for example 12 of 60 runs), Results in. It also says what the agent gets (each test's request, and the prepared reply if it asks for help) and what stays in AgentScore (pass rules, forbidden actions, exam tests until they run). Checks inside the customer's system run outside the agent and AgentScore does the scoring, so the agent can't grade itself.
- **Stats:**
  - Tests ready: 0 of 20. 1 approved and waiting on setup, 10 more in progress.
  - Labels this week: 8 of 45, 3 of the 12 "went wrong" needed.
  - Practice / exam: 6 / 5. "Exam tests stay hidden from whoever tunes the agent."
  - Mix so far: aim vs now, "needs more went fine."
- **Tests per task:** Sales order (VA01) 4 of 8 · House bank (FI12) 2 of 4, 1 generated · Car insurance quote 2 of 4, 1 to generate · Salesforce 2 of 4.
- **Kinds of mistake covered** (proposed; how many tests check for each, counts are examples):
  - Missed a warning or error 2 · Didn't ask when it should have 2 · Repeated the same step 1 · Changed something it shouldn't 1 · Used the wrong record 1.
  - **Skipped a step it was told to do 0** and **Gave up too early 0** are flagged red, each with a **Find runs** button that goes back to the suggestions.
  - System problems 1, a recovery test only, which doesn't count.
  - "When the test set runs, results break down by task and by kind of mistake, so you can see which kinds a new version fixed or started making."
- **Filter:** All 11 · Needs you 2 · Waiting on your agent 4 · Being labeled 4 · Ready 0.
- **Tests** (all but the first two are examples):

| Test | Area | Came from | Set | Status |
|---|---|---|---|---|
| **Sales order for a blocked customer** | VA01 | A run that went wrong | Practice | Approved, waiting on setup |
| Sales order, told to use another customer | VA01 | Second answer in the label | Practice | Needs your review |
| Standard sales order, customer not blocked | VA01 | A run that went fine | Exam | Waiting on your agent: test data |
| Sales order in German shorthand | VA01 | An unusual run | Practice | Being labeled |
| Change a house bank account | FI12 | A run that went fine | Exam | Being labeled |
| House bank change while SAP stops responding | FI12 | An outage, kept as a recovery test | Practice | Optional, doesn't count toward the score |
| Get a car insurance quote | Web app | A run that went fine | Exam | Being labeled |
| Insurance quote, agent asks for the driver's age | Web app | An unusual run | Practice | Waiting on your agent: scripted answer |
| Opportunity saved under the wrong account | Salesforce | A run that went wrong | Exam | Being labeled |
| Route a support case | Salesforce | Published set: CRMArena | Exam (nobody tuning the agent has seen it) | Waiting on your agent: test data and checks |
| Change a house bank account, IBAN left blank | FI12 | Generated from a real FI12 run | Practice (generated tests never go in the exam) | Needs your review |
| + 9 more to pick from the suggestions | | | | |

**Action:** Review the next suggestion.
**Next:** back to step 3 for the next run.

**For the PM and designer:** this is the dataset and task store. Today it doesn't exist: the list is a JSONL file in the customer's repo, and runs link to tests only through the `benchmark.task_id`, `benchmark.run_id` and `benchmark.trial` span attributes. The user's agent runs the tests and tags each run with `benchmark.task_id`, `benchmark.run_id` and `benchmark.trial`. AgentScore then scores them (`score_agent` scoped to one `benchmark.run_id`). The agent receives only each task's request and the prepared reply. Criteria, forbidden actions and exam tasks stay server-side, and state checks run outside the agent. The pilot's three scenario families are VA01, FI12 and the vehicle-insurance web app.
The per-kind breakdown is the workflow's step 13 report.
**Gaps:** a dataset and task store; scoring scoped to traces carrying a given `benchmark.run_id`; hand-off of tests to the user's agent; criteria hidden from the agent; error categories.

# Docs ↔ Product Drift Log

Tracks every place the customer-facing docs (`src/content/*.tsx`) disagree with the
live product at `https://agent-score-customer.product.tricentis.com`.

**Direction of truth:** the **live product is authoritative for what is true today.**
Where a row is marked _product-should-catch-up_, the docs describe the intended
end-state and the gap is a product to-do, not a docs error. Where a row is marked
_docs-should-update_, the docs are simply stale and should be corrected.

Each audit appends a dated section. Newest first.

---

## 2026-10-29 - docs-sync agent run

- **Site audited:** https://agent-score.stg.ai.tricentis.com (staging, per `AGENT_SCORE_SITE_URL` in `.env`; authenticated Playwright session reused). `https://agent-score.ai.tricentis.com/` was not walked in this pass.
- **GitHub scan:** 0 PRs merged after 2026-10-29T15:16:37Z. The inclusive API query returned #890 at that exact marker, already scanned in the preceding run.
- **Result:** no drift.

### Doc edits made

None. The live **Connect a coding agent (MCP)** card still names Claude Code, Cursor, Codex, Claude apps, and Another client; uses Streamable HTTP; requires the whole tenant URL; and signs in with Tosca Cloud in the browser, with no key, token, header, or client ID. Its Claude Code tab still follows Add / Sign in / Check it works, including the `check my agent connection` prompt. This matches Connect with MCP and the MCP-first quick start added earlier today.

### Product gaps (logged only)

None found in this pass. The existing Profile-tab verdict-label gap was not re-walked.

### Pending verification

The existing 2026-10-29 pending items remain: hosted-client consent warning, customer credit gating for single-trace scoring and run resume, the MCP capability list beyond connection checks, the duplicated tenant filter, and the accepted-terms gate. No new PR made one of them newly testable.

### Judgment calls

This was a narrow confirmation run. The scan found no newly merged PRs and the walk revisited the MCP onboarding card only. Other customer screens and the in-app `/docs` copy were not re-walked.

### File changes

- Pages: none
- Assets: none
- `CHANGELOG.md`: unchanged
- `package.json` version: unchanged
- `docs/index.html`: not rebuilt (no doc edits)
- `.last-github-sync`: unchanged (2026-10-29T15:16:37Z; no newer PR)

---

## 2026-10-29 - docs-sync agent run

- **Site audited:** https://agent-score.stg.ai.tricentis.com (staging, per `AGENT_SCORE_SITE_URL` in `.env`). `https://agent-score.ai.tricentis.com/` returned 200 this run and was not walked. `https://agent-score-customer.product.tricentis.com/` still returns 404.
- **GitHub scan:** 38 PRs merged after 2026-10-26T15:55:41Z. Kept as customer-facing: #868 (MCP URL inline in each setup step), #879 (what the tools do, on the connect copy and the concepts resource), #883 (hosted-client consent warning), #877 (single-trace scoring and run resume gated on credits). #855 and #880 are sign-in hardening that shows up in the troubleshooting copy.
- **Result:** 3 discrepancies edited, plus items left pending. The in-app `/docs` page on staging is a separate copy in the product repo and was not edited. Customer docs for this run are `agent-score-marketing/docs-src`.

### Doc edits made

- Page: connect-with-mcp (new) / `ConnectWithMcp.tsx`, `nav.ts`, `content/index.ts`
  Claim in docs: No page. Connect Your Agent described a three-tab card (Claude Code, Cursor, Claude Desktop) and treated MCP as an optional extra under the OpenTelemetry steps.
  Reality in prod: Integrations leads with **Connect a coding agent (MCP)**. Tabs are Claude Code, Cursor, Codex, Claude apps, and Another client. Each tab is add, sign in, check. Transport is Streamable HTTP. Sign-in is the Tosca Cloud account in the browser, with no key, token, header, or client ID. The URL must be pasted whole.
  Direction: docs-should-update
  Fix: New page, screenshot `mcp-connect-card.png`, glossary term MCP. Welcome's getting-started card and Connect step point here.
  Severity: high
  PR: https://github.com/Tricentis-AI/agent-score/pull/868

- Page: welcome / `Welcome.tsx`
  Claim in docs: Connect is "a two-line OpenTelemetry export." The Getting Started card links to Connect Your Agent.
  Reality in prod: The customer-facing setup on Integrations is the MCP card. The user asked the quick start to send people there.
  Direction: docs-should-update
  Fix: Getting Started links to Connect with MCP. The Connect step says the coding agent signs in, creates the ingest key, and checks that traces arrived.
  Severity: high

- Page: connect-your-agent / `ConnectYourAgent.tsx`
  Claim in docs: "Let your coding agent do the setup" names Claude Code, Cursor, and Claude Desktop, and says Cursor sign-in is a Login button. The Integrations screenshot matches that older card. The wizard caption calls itself the fastest way.
  Reality in prod: Five clients, and Cursor sign-in is Customize, then MCP. The wizard is still on My Agents as Connect Agent.
  Direction: docs-should-update
  Fix: The page now opens on the MCP path and keeps the exporter lines and the wizard as the manual path. Removed the stale Integrations screenshot.
  Severity: high
  PR: https://github.com/Tricentis-AI/agent-score/pull/839 (confirmed this run; was pending on 2026-10-26)

### Product gaps (logged only)

- Page: dimensions-and-profiles (Profile tab "The bar")
  Not re-walked this run. The 2026-10-26 gap still stands: the Profile tab's verdict labels lag the Score tab.
  Direction: product-should-catch-up
  Fix: log only - product gap
  Severity: medium

### Pending verification

- Page: connect-with-mcp - The Integrations card intro only says the client can create ingest keys and check that traces arrived. The "what you can ask for" list (score, failed trace, advice, compare a change, write an eval) and the "a change takes effect when you ask" callout come from the MCP prompts and `connect_from_your_coding_agent.md` in the product repo (PR #879), not from a tool call made during this walk. Re-check by using a connected client next run.
  Severity: medium
  PR: https://github.com/Tricentis-AI/agent-score/pull/879
- Page: (none) - PR #883. The hosted-client consent page now warns that a forwarded link hands the account to the sender. This walk did not open a consent page.
  Severity: low
  PR: https://github.com/Tricentis-AI/agent-score/pull/883
- Page: (none) - PR #877. Single-trace scoring and run resume are gated on credits. Not exercised.
  Severity: low
  PR: https://github.com/Tricentis-AI/agent-score/pull/877
- Page: welcome - PR #836, still pending from 2026-10-26. The My Agents tenant filter still lists "tais" twice, with no external/internal tag.
  Severity: low
  PR: https://github.com/Tricentis-AI/agent-score/pull/836
- Page: welcome - Terms gate at sign-in (PRs #762 / #763). This account has already accepted, so the gate was not on screen. The Account page was not re-opened this run.
  Severity: low

### Judgment calls

- **Staging, not production.** `.env` points at staging. `agent-score.ai.tricentis.com` returned 200 and was not walked, so these edits describe staging.
- **Screenshot shows the staging host and the tais tenant.** Same practice as earlier captures: a real page, not a mock. The URL in the picture is that tenant's URL.
- **Did not re-walk** the scorecard, profile, evals catalog, assistant, or settings. No doc edits on those pages this run.
- **In-app Docs** at `/docs` on staging still has its own nav (including "Your Own Evals") and does not pick up this repo until the product copies it. Left untouched, per the request that customer docs live in `agent-score-marketing/docs-src`.

---

## 2026-10-26 - docs-sync agent run

- **Site audited:** https://agent-score.stg.ai.tricentis.com (staging, per `AGENT_SCORE_SITE_URL` in `.env`; production `https://agent-score-customer.product.tricentis.com/` still returns 404, so staging was audited instead. Fresh Playwright profile; the first pass stopped at the Okta sign-in, the user signed in in that window, and the walk resumed.)
- **GitHub scan:** 93 PRs merged since 2026-09-28T16:26:48Z (#756 is the boundary PR already covered last run), 32 kept as customer-facing (#760, #762, #763, #771, #779, #797, #799, #801, #803, #804, #817, #818, #819, #823, #825, #829, #830, #831, #833, #834, #835, #836, #838, #839, #840, #845, #846, #847, #848, #849, #851, #852)
- **Result:** 21 discrepancies (13 docs-should-update, 2 product-should-catch-up, 6 pending-verification)

### Doc edits made

- Page: eval-catalog / `EvalCatalog.tsx`
  Claim in docs: The catalog "lives in Agent Score's Back Office ... rather than browsed self-serve in the customer app." The screenshot alt text says "62 evals."
  Reality in prod: The customer app has an **Evals** area (`/evals`) with My drafts / Our evals / Built-in evals / Dimensions / Profiles tabs. Built-in evals lists 41 evals (matching the docs' 41), and there are 11 dimensions (matching the docs).
  Direction: docs-should-update
  Fix: Rewrote "Browsing the catalog" around the Built-in evals tab, replaced `catalog-door.png` with `evals-builtin-catalog.png`, and linked the new custom-evals page.
  Severity: high
  PR: https://github.com/Tricentis-AI/agent-score/pull/803

- Page: custom-evals (new) / `CustomEvals.tsx`, `nav.ts`, `content/index.ts`
  Claim in docs: No page. The Custom Evals page was dropped on 2026-10-01 when evals were Back Office only, but Welcome still says "how to build your own in plain English."
  Reality in prod: Create -> Eval / Dimension / Profile. The New eval form has name/slug, dimensions, default threshold, input needs, three answers (what is checked / full score / zero) with a read-only compiled rubric, and "Preview on an agent" (up to 5 traces, about $1.00 per trace, billed to AI credits, nothing saved). Save draft (visible only to you) or Save and publish. An organization chip/picker sits in the header, and the Profile tab has "Create an eval / a profile for this agent".
  Direction: docs-should-update
  Fix: New page "Building Your Own Evals" under Evaluations, a new asset `custom-eval-three-answers.png`, and a new Glossary term "Custom eval".
  Severity: high
  PR: https://github.com/Tricentis-AI/agent-score/pull/801, https://github.com/Tricentis-AI/agent-score/pull/803, https://github.com/Tricentis-AI/agent-score/pull/823

- Page: dimensions-and-profiles / `DimensionsAndProfiles.tsx`
  Claim in docs: "Brand-new agents start on General Answerer ... falls back to until ... evidence diversity hasn't yet crossed the threshold ... not a placeholder."
  Reality in prod: New agents are bound to **Default v1** ("Placeholder profile auto-assigned to every new agent. It carries no checks ... no scoring run is created against it"). The Profile tab says "captured 5 of the 20 traces needed before a scoring profile can be chosen." After 20 traces a real profile is picked even with diversity below 3.0 (chatbotagentgraph is on Task Agent with "evidence diversity 1.430 still below the 3.0 threshold"). This also resolves the 2026-09-28 pending "Default" item: it is a placeholder, not an 8th customer profile.
  Direction: docs-should-update
  Fix: Replaced the paragraph with the Default-placeholder / Learning-your-agent / Fit history description, and added a note that "Default" appears in profile lists as a placeholder.
  Severity: high

- Page: dimensions-and-profiles / `DimensionsAndProfiles.tsx`
  Claim in docs: `profile-tab-general-answerer.png` shows the old 4-tab layout (Score / Agent Card / Profile / Activity).
  Reality in prod: There are 7 tabs, and an "Evals for this agent" section sits at the top of the Profile tab.
  Direction: docs-should-update
  Fix: New screenshot `profile-tab-task-agent.png` (chatbotagentgraph, Task Agent), updated alt text and caption, deleted the old file, and added a sentence on the Create an eval / profile shortcuts.
  Severity: medium
  PR: https://github.com/Tricentis-AI/agent-score/pull/803

- Page: workspace-assistant / `WorkspaceAssistant.tsx`
  Claim in docs: "the only action it can take is starting a scoring run." Sessions are "scoped to one tenant." The screenshots show the old copy.
  Reality in prod: The new-session copy says it "changes something only after you approve it: starting a scoring run, drafting, versioning, publishing and previewing evals and profiles, or queuing a profile's agents for re-scoring." The copy says "your organization's agents."
  Direction: docs-should-update
  Fix: Rewrote the callout and wording, and replaced `assistant-intro.png` and `assistant-input.png`.
  Severity: high
  PR: https://github.com/Tricentis-AI/agent-score/pull/804, https://github.com/Tricentis-AI/agent-score/pull/829

- Page: connect-your-agent / `ConnectYourAgent.tsx`
  Claim in docs: Integrations is described as an API-keys table only.
  Reality in prod: There is a "Connect from your coding agent" card above the keys: MCP server URL, Claude Code / Cursor / Claude Desktop tabs, a setup prompt, browser sign-in with "No headers, no token", and a note about retrying a failed sign-in.
  Direction: docs-should-update
  Fix: New "Let your coding agent do the setup" section, plus a replaced `integrations-tab.png` with updated alt text and caption.
  Severity: medium
  PR: https://github.com/Tricentis-AI/agent-score/pull/833

- Page: connect-your-agent / `ConnectYourAgent.tsx`
  Claim in docs: "From the Agents page, **+ Connect Agent**."
  Reality in prod: The page is "My Agents" and the button is "Connect Agent". The wizard content matches the docs.
  Direction: docs-should-update
  Fix: Updated the label.
  Severity: low

- Page: scorecard / `Scorecard.tsx`, glossary / `Glossary.tsx`
  Claim in docs: The 0-39 band is "Block".
  Reality in prod: Agents scored 20.0 (function-caller-stg-test) and 16.6 (e2e-sim-043953) show **Don't ship** on the Score tab, My Agents, and Home. Settings -> Verdict thresholds says "Below the lowest floor is 'Don't ship'." This closes the 2026-08-27 "could not confirm the live label for the 0-39 band" item.
  Direction: docs-should-update
  Fix: Changed the table row and the Glossary verdict list to "Don't ship".
  Severity: high

- Page: scorecard / `Scorecard.tsx`
  Claim in docs: `scorecard-tab.png` shows 4 tabs and "scored / skipped / failed / retired" counts.
  Reality in prod: There are 7 tabs, and the counts are "107 scored / 33 could not be evidenced / 0 retired".
  Direction: docs-should-update
  Fix: Replaced the screenshot with chatbotagentgraph, 99.8 Ship, and updated the alt text.
  Severity: medium

- Page: scorecard / `Scorecard.tsx`
  Claim in docs: Each eval result "carries ... the trace span it came from" (no link).
  Reality in prod: The trace IDs in the "Where the score comes from" drill-down link to `/tenants/<t>/agents/<a>/traces/<id>` (confirmed on chatbotagentgraph -> task_completion).
  Direction: docs-should-update
  Fix: Added a sentence linking to the Traces page.
  Severity: low
  PR: https://github.com/Tricentis-AI/agent-score/pull/779

- Page: agent-card / `AgentCard.tsx`
  Claim in docs: The screenshot shows the old layout (4 tabs, "Synthesized by the judge model", flat lists, an observed-tools table with inferred descriptions).
  Reality in prod: The card has an Evidence snapshot (sampled traces, date range, observed tools), a Regenerate button, an "Observed tool activity" table (Calls / Successful calls) with "View generated tool descriptions", and collapsible Typical behavior / Suggested success criteria / Potential failure modes marked "Draft - not verified".
  Direction: docs-should-update
  Fix: Replaced `agent-card-customer.png` (rag-support-agent), updated the alt text and caption, and added a paragraph on the evidence snapshot and Regenerate.
  Severity: medium

- Page: welcome / `Welcome.tsx`
  Claim in docs: `home-dashboard.png` and its alt text show a per-day "verdict trend table" of Ship / Review / Block chips.
  Reality in prod: Verdict trend is a three-line sparkline chart with a 7-day total per verdict.
  Direction: docs-should-update
  Fix: Replaced the screenshot and updated the alt text.
  Severity: medium
  PR: https://github.com/Tricentis-AI/agent-score/pull/760

- Page: welcome / `Welcome.tsx`
  Claim in docs: Terms of Service are not mentioned.
  Reality in prod: The Account page (sidebar Settings) has a "Terms of Service" card: "You accepted version 1 for tais on 10/2/2026", a SHA-256 fingerprint, "Download the version you accepted", and "Current terms".
  Direction: docs-should-update
  Fix: Added a short callout.
  Severity: low
  PR: https://github.com/Tricentis-AI/agent-score/pull/762

### Product gaps (logged only)

- Page: dimensions-and-profiles / scorecard (Profile tab "The bar")
  Claim in docs: The verdict labels are Ship / Ship with note / Needs work / Don't ship (recommended) / Don't ship.
  Reality in prod: The Profile tab's "The bar" still reads Review required / Block recommended / Block, while the Score tab, My Agents, Home and Settings -> Verdict thresholds use the docs' labels. This is the 6th audit in a row confirming it. Note that the new `profile-tab-task-agent.png` necessarily shows the old Profile-tab labels, as the previous screenshot did.
  Direction: product-should-catch-up
  Fix: log only - product gap
  Severity: medium

- Page: scoring-engine / `ScoringEngine.tsx`
  Claim in docs: The judge model supports "Anthropic Claude, OpenAI, Azure OpenAI, and Amazon Bedrock", and you pick the provider on the Settings tab.
  Reality in prod: The Settings -> Model connection Provider dropdown offers only **bedrock** and **ai hub** (checked on rag-support-agent).
  Direction: product-should-catch-up (see Judgment calls)
  Fix: log only - product gap
  Severity: medium

### Pending verification

- Page: connect-your-agent - PR #839 (per-client MCP setup guide: Codex, Claude apps, "Another client", scope choices, Troubleshooting). Staging still shows the earlier three-tab card (Claude Code / Cursor / Claude Desktop). The docs describe only what is live. Fix: log only - re-check next run. Severity: low. PR: https://github.com/Tricentis-AI/agent-score/pull/839
- Page: welcome - PRs #762 / #763 (terms gate at sign-in with Download PDF and Print). I could not see the gate because this account had already accepted. Fix: log only - re-check next run. Severity: low. PR: https://github.com/Tricentis-AI/agent-score/pull/763
- Page: (none) - PR #836 (merged same-named internal/external tenants in tenant filters, tagged "external · internal"). The My Agents tenant filter still lists "tais" twice with no tag. Fix: log only - re-check next run. Severity: low. PR: https://github.com/Tricentis-AI/agent-score/pull/836
- Page: connect-your-agent - PRs #838, #840, #845-#849, #851, #852 (MCP tools, prompts, and the onboarding / product-concepts resources). These can't be seen in the web UI, and I didn't verify them through an MCP client. Fix: log only - re-check next run. Severity: low. PR: https://github.com/Tricentis-AI/agent-score/pull/852
- Page: custom-evals - PRs #825 / #830 / #819 (re-score wording "queued, running with the agent's next scoring run", unsaved-answers prompt, preview surviving a reload, the profile builder and apply-and-re-score). I did not exercise these, because they would need filling and submitting forms or spending credits. The new page avoids claiming them. Fix: log only - re-check next run. Severity: low. PR: https://github.com/Tricentis-AI/agent-score/pull/825
- Page: (none) - PRs #771 (example-agent removal), #797 (traces over 8 MiB left out of scoring), #799 (plain `tenant` attribute accepted). #771 would mean removing an example agent, and #797 / #799 are backend-only, so none were observable in the walk. No doc currently claims otherwise. Fix: log only - re-check next run. Severity: low. PR: https://github.com/Tricentis-AI/agent-score/pull/797

### Held for review

None. I checked all 93 PR bodies and the walked pages for instruction-like content and found nothing.

### Judgment calls

- **Staging, not production.** `.env` points at staging and production returns 404, so everything above was checked against staging. Staging may carry features that haven't reached production (custom evals, MCP), so the docs now describe staging behavior.
- **Judge-model providers classified product-should-catch-up.** The docs' four-provider list reads like the intended spec, so I didn't narrow it to "bedrock / ai hub." If the dropdown is the real, final list, flip this to docs-should-update.
- **Custom evals page scope.** I wrote only what I saw (Evals area tabs, Create menu, New eval form, preview limits, draft/publish). The line "ready to add to a profile alongside built-in evals" rests on the Create -> Profile entry and PR #803's profile-builder description; I did not walk the profile builder itself.
- **Terms of Service callout** comes from the Account page card. The gate itself was inferred, not seen.
- **Kept `studio-library.png`, `studio-geval.png`, `studio-hybrid.png`** (Back Office eval detail views from August). Their captions don't claim a location, but customers now see eval detail in the Evals area, so they may want refreshing.
- **Home's verdict trend groups runs as Ship / Review / Block** while individual verdicts read "Don't ship". I read this as a grouping label, not a verdict label, and didn't log it as a gap.
- **AI credits chip missing** from the new Score and Profile tab screenshots. It renders after a delay on agent pages (it's present on the Agent Card capture taken the same way). Cosmetic only.
- **Dropped as internal or cosmetic but borderline:** #781-#783 (sign-in sizing), #772 (sign-in browser compatibility), #787 (synced the in-app `/docs` copy - worth knowing it exists), #795 (repo-internal docs).
- **Agent detail tabs** are Score / Improve / Agent Card / Traces / Profile / Labeling / Settings. There is no "Activity" tab any more; recent activity sits at the bottom of the Profile tab. No doc page names an Activity tab.

### File changes

- Pages: edited `Welcome.tsx`, `ConnectYourAgent.tsx`, `WorkspaceAssistant.tsx`, `EvalCatalog.tsx`, `DimensionsAndProfiles.tsx`, `AgentCard.tsx`, `Scorecard.tsx`, `Glossary.tsx`, `content/index.ts`, `nav.ts`; added `CustomEvals.tsx`
- Assets: replaced `home-dashboard.png`, `integrations-tab.png`, `assistant-intro.png`, `assistant-input.png`, `scorecard-tab.png`, `agent-card-customer.png`; added `evals-builtin-catalog.png`, `profile-tab-task-agent.png`, `custom-eval-three-answers.png`; removed `catalog-door.png`, `profile-tab-general-answerer.png`
- `CHANGELOG.md`: `## [0.40.0] - 2026-10-26`
- `package.json` version: 0.39.0 -> 0.40.0 (minor: the entry has Added items, including a new page)
- `docs/index.html`: rebuilt (`pnpm run build` passed)
- `.last-github-sync`: 2026-09-28T16:26:48Z -> 2026-10-26T15:55:41Z
- Not committed, not pushed.

---

## 2026-09-28 — GitHub merge scan + staging walk (Playwright, session already authenticated)

Production (`https://agent-score-customer.product.tricentis.com`) returned
**404 "no app matched"** from the AWS load balancer for the entire duration of
this run (TLS/cert fine, so a real routing/deploy gap, not DNS/VPN) - confirmed
with the user, then audited against the `.env`-configured staging host
(`https://agent-score.stg.ai.tricentis.com`) instead, per explicit go-ahead.
Everything below is checked against staging, not confirmed production.

Cross-checked 8 PRs merged on `Tricentis-AI/agent-score` since the
`.last-github-sync` marker (2026-09-25T12:50:15Z). Only one,
[#754](https://github.com/Tricentis-AI/agent-score/pull/754) ("Opened every
trace link by trace id alone, removing the leftover timestamp requirement"),
was customer-facing; the other seven (#748-753, #755, #756) were internal
security/audit/logging fixes with no visible UI change.

**PR #754 - confirmed fixed, no doc claim to update.** Opened a trace
directly by trace ID (`/traces/<id>?view=spans`, no `?timestamp=`) and it
loaded cleanly. No page in the docs described the old broken behavior, so
there was nothing to edit - noting here only as confirmation the fix is live
on staging.

**Missing pages - Traces, Improve, Labeling (docs-should-update, high,
fixed).** The agent-detail view has grown from the 4 tabs the docs describe
(Score / Agent Card / Profile / Settings) to 7: **Improve**, **Traces**, and
**Labeling** had no documentation anywhere. Added three new pages under The
Scoring Journey - see CHANGELOG 0.39.0.

**Usage & cost table missing a column in prose (docs-should-update, low,
fixed).** `ScoringEngine.tsx`'s description and screenshot alt text listed
the Usage & cost columns but omitted **Agent cards**, which was already
visible in the existing screenshot (the image itself was never stale, only
the surrounding text). Fixed both.

**Eval count inconsistency, own-doc mismatch (docs-should-update, low,
fixed).** `EvalCatalog.tsx` said "over 60" / nav said "60+" in prose while
its own screenshot alt text said "62." Could not independently re-verify the
live count - the eval catalog/builder lives in Back Office, not reachable
from the customer app - so this is a lower-confidence fix that trusts the
screenshot's more specific number over the prose. Aligned Welcome, nav.ts,
and EvalCatalog.tsx to "62."

**Integrations tenant selector, removed (docs-should-update, medium,
fixed, per explicit user call).** `ConnectYourAgent.tsx`'s `integrations-tab.png`
showed a "Tenant" dropdown above the API-keys table; live staging Integrations
page has no such selector - this account only has one tenant ("tais"), so the
live walk alone couldn't distinguish "real UI simplification" from
"single-tenant test-account artifact." User confirmed: tenants are no longer
customer-facing in this app, all keys show together. Replaced the screenshot
and removed the selector from the alt text/caption; left the surrounding
"each key belongs to one tenant" prose alone since nothing observed
contradicted it.

**"Default" profile, logged only - not resolved (pending-verification,
medium).** `DimensionsAndProfiles.tsx` says Agent Score ships 7 profiles
(Grounded Answerer, Summarizer, Tool Caller, Task Agent, Conversational
Assistant, Policy Guardrail, General Answerer). Production's live "Change
profile" picker on an agent's Profile tab lists an 8th: **Default**. Per
user instruction, not resolved this run - could be a real 8th customer-facing
profile the doc missed, or an internal/system-only profile that's
deliberately not customer-facing. Needs product-team input before editing
the doc either way.

---

## 2026-09-25 — GitHub merge scan + staging walk (Playwright, customer login via Tosca Cloud)

Cross-checked 126 PRs merged on `Tricentis-AI/agent-score` since the
`.last-github-sync` marker (2026-09-09T11:30:41Z), and walked the customer app
live on **staging** (`https://agent-score.stg.ai.tricentis.com`, not the usual
production host - staging is where this pass audited against, per the user's
request). Login is now Tosca Cloud, not the customer/password form earlier
audits describe.

**Verdict-label product inconsistency, re-confirmed still open (5th audit in
a row).** Found this independently before checking this log, and initially
proposed - and briefly applied - flipping the docs to the Profile tab's
"Review required" / "Block recommended" wording. **Reverted before commit**
once this log surfaced the history: 2026-08-17 first found the product
internally inconsistent; 2026-08-27 deliberately set the docs to "Needs
work" / "Don't ship (recommended)" to match the Score tab and back-office
Home worklist; 2026-08-27, 2026-09-08, and 2026-09-09 all re-confirmed the
Profile tab's "The bar" table is the one stale surface. Checked again today
on `rag-support-agent`'s Profile tab: still "Review required" / "Block
recommended," unchanged. Direction: **product-should-catch-up**, unchanged.
**Do not flip the docs to the Profile-tab wording** - this is now five
audits confirming the same one-sided product bug.

**Resolved this pass** (docs edited, see CHANGELOG):
- Welcome, Glossary: two "letter grade" / "grade" references missed in the
  2026-08-27 letter-grade removal (Welcome's hero paragraph and "Decide"
  step; Glossary's Scorecard definition). docs-should-update, high.
- Scoring Engine Settings: judge-model provider/model/region is now
  self-serve per agent (Settings tab → Model connection, with Test
  connection / Save settings, credential override optional). The doc said
  to "ask the Agent Score team." docs-should-update, high.
- Scoring Engine Settings: the "usage log isn't in the app today" claim is
  false - a real **Usage & cost** page (`/usage`) exists: traces, tokens
  in/out, usage cost, eval results, scoring runs, profile fits, eval cost
  in AI credits, a 30/60/90-day window, Export to Excel. docs-should-update,
  high.
- Scoring Engine Settings: added the per-agent **Cost** section (input/
  output $ per 1M tokens) that feeds the Usage page - net-new content, not
  previously documented at all.
- Welcome: the hero screenshot/copy showed a card-grid "Agents" dashboard
  that no longer matches production. Customers now land on **Home** first
  (tour banner, real-agent/interaction/scoring-run/needs-attention tiles,
  verdict trend, removable example agents) - `/agents` itself is now a
  table, not cards. docs-should-update, high.
- Welcome, Glossary, Scoring Over Time: **AI credits** - a header balance
  gating billable actions - had zero doc coverage despite being visible on
  every page from first login. Added a short mention in each. Net-new,
  high.
- Reading Your Scorecard: added per-agent verdict-**band** overrides
  (distinct from the label-wording bug above - this is the numeric
  threshold override feature, confirmed on the Settings tab with correct
  "Needs work" / "Don't ship (recommended)" labels and a "Reset to profile
  defaults" control). Net-new, medium.
- Dimensions & Profiles: added the manual "Change profile" / "Re-evaluate
  fit" controls on the Profile tab - the automatic first pick isn't final.
  Net-new, medium.
- Connect Your Agent: the wizard-launch button is "+ Connect Agent," not
  "+ Add agent." Everything else about that wizard (4 steps, 20-trace
  note, exact env-var format, now serving a real per-region endpoint per
  PR #700) still matches. docs-should-update, low.
- Scoring Over Time: the "Activity" tab this page described (with a
  screenshot) no longer exists by that name. Confirmed live tabs are Score
  / Improve / Agent Card / Traces / Profile / Labeling / Settings. The
  run-history content now lives in the Score tab's own **Score over time**
  section - re-pointed the doc and screenshot there. Couldn't capture a
  populated example (no agent in this tenant has 2+ scored runs yet); the
  screenshot shows the empty "not enough history" state. **Re-capture with
  real run history next time an agent has one.**

**New page this pass:**
- **Ask the Assistant** (`workspace-assistant`, under Get Started) - a
  tenant-scoped chat, new nav item, also reachable as "Ask the assistant"
  from any agent page. Reads freely; the only write action (starting a
  scoring run) asks first. PRs: #713 (added to customer app).

**Confirmed live, still undocumented - deferred to a future pass:**
- The **Improve** and **Labeling** tabs on agent detail exist now (PRs
  #617-619 were pending-verification as of 2026-09-09; confirmed live
  today). Neither has any doc coverage. docs-should-update, medium -
  deferred, not written this pass.
- **Consent / terms-of-service gate** (PRs #731, #733, #735, #736, #740) -
  confirmed merged, not confirmed live in this walk (this account had
  already accepted). Scoped **out** of this pass deliberately: it reads as
  a legal/compliance gate, not a "how the product works" feature - flagging
  for the team to confirm that's the right call rather than silently
  deciding it belongs in the onboarding guide.
- New MCP-related eval names (`mcp_task_completion`, `multi_turn_mcp_use`)
  seen on a live Task Agent profile aren't in the Evaluation Catalog's
  "Agentic & Tool-use" sample row. Low severity - that table is explicitly
  a sample, not an exhaustive list.

`.last-github-sync` advanced to `2026-09-25T12:50:15Z` (mergedAt of PR
#747, the newest PR this scan looked at).

---

## 2026-09-09 — GitHub merge scan + production walk (Playwright, customer login)

Cross-checked PRs merged on `Tricentis-AI/agent-score` since the `.last-github-sync`
marker (2026-09-08T13:20:52Z), and walked the customer app live logged in as a
customer.

**Merge scan:** 22 PRs merged in the window; only #626 (chat-assistant model/caps),
#619/#618/#617 (advice/Improve-tab work), and #598 (already resolved 2026-09-08) were
candidates. #626 is an internal chat-assistant config change with no customer-facing
surface. CI/platform/DB/infra PRs (#620-625) are internal. Everything else was
already covered by the 2026-09-08 pass.

**No doc edits this pass** - log-only run:

- **Verdict-label product inconsistency, re-confirmed still open (4th audit in a
  row).** Walked a fully-scored agent (`file reader agent`, composite 35.2,
  `Conversational Assistant` profile) live today: its **Profile tab** "The bar"
  table still shows "Review required" / "Block recommended," unchanged from the
  2026-08-27 and 2026-09-08 findings. Docs (`scorecard`, `glossary`) correctly use
  "Needs work" / "Don't ship (recommended)" per the established direction of
  truth - do not re-flip this again without first checking this log. Direction:
  **product-should-catch-up** (Profile tab is the stale surface).

- **New "Improve" tab / advice feature - pending-verification.** PRs #617
  ("feat(advice): make progress and recovery reflect durable requests"), #618
  ("feat(backoffice): clarify agent review pages and preserve advice history"),
  and #619 ("feat(scoring): consolidate run results and simplify advice
  navigation") describe a new **Improve tab** with an advice panel/history for
  agent-improvement recommendations. Walked `file reader agent`'s detail page
  live (fully scored, 159 evaluations) and saw only **Score / Agent Card /
  Profile / Activity** - no Improve tab present. #618 is tagged
  `feat(backoffice)` and may be back-office-only; #617/#619 aren't tagged
  backoffice-only but the feature isn't visible in the customer app yet
  (deploy lag or gating). Not added to docs on the PRs' word alone - re-check
  next run. PRs:
  https://github.com/Tricentis-AI/agent-score/pull/617,
  https://github.com/Tricentis-AI/agent-score/pull/618,
  https://github.com/Tricentis-AI/agent-score/pull/619

- **Observation only (not a docs claim, not edited): agent status stuck on
  "Setting up" despite a completed score.** `ConnectYourAgent.tsx` says an agent
  moves to "Scored" (or "Needs attention") once its first run completes. Live,
  `file reader agent` has a completed run (composite 35.2, "complete", 159
  evaluations scored) but its status badge - on both the fleet cards and the
  detail-page header - reads "Setting up" everywhere checked. Only one scored
  agent existed in this tenant to check, so this is a single data point, not
  confirmed as systemic. Logged for the team to investigate; not treated as a
  docs claim to fix either direction.

Rest of the docs (Connect Agent wizard, Integrations page, Agent Card tab,
Activity tab, dimension/profile catalog) matched production with no drift found.

`.last-github-sync` advanced to `2026-09-09T11:30:41Z` (mergedAt of PR #626, the
newest PR this scan looked at).

---

## 2026-09-08 — GitHub merge scan + production walk (Playwright, superadmin + customer logins)

Cross-checked 190 PRs merged on `Tricentis-AI/agent-score` since the
`.last-github-sync` marker (2026-08-27), and walked both the customer app and the
back office live, logged in as a superadmin.

**Merge scan:** of 190 PRs, only PR #598 ("seed seven fit-ready profile
families...") was customer-visible enough to require a `docs-src` change. PR #588
("make the improvement advisor usable end to end...") is relevant but its own
body confirms it only added a trigger and an API endpoint - no rendered surface -
and the live walk (below) found no advisor/recommendation UI anywhere, so it's
logged as pending-verification, not fixed. Everything else (back-office
chat-assistant polish, judge-calibration campaigns, e2e suites, migrations,
CI/infra) is internal.

**Resolved this pass** (docs edited, see CHANGELOG):
- `dimensions-and-profiles`, `agent-card`, `glossary` - the profile catalog was
  entirely stale. Docs listed 7 old names (RAG, Computer-Use, Conversational,
  Tool-Orchestrator, Code, Structured-Generation, EvalClaw) plus a separate
  "General Starter" fallback. PR #598 replaced the whole catalog; confirmed live
  across 9+ agents in both the customer app and the back office's Agent Registry:
  **Grounded Answerer, Summarizer, Tool Caller, Task Agent, Conversational
  Assistant, Policy Guardrail, General Answerer** (the last is the renamed
  fallback - same 4 dimensions as the old "General Starter," internal id
  `general-starter` unchanged). Direction: **docs-should-update**. Severity: high.
  - Swapped `dimensions-and-profiles`'s screenshot for a live capture of the
    General Answerer profile tab (`profile-tab-general-answerer.png`, replacing
    `profile-tab.png` which showed the retired RAG Starter profile).
  - `AgentCardMock.tsx`'s mock "Recommended profile" value updated from
    `Tool-Orchestrator` to `Tool Caller`.

**Still outstanding (not touched this pass):**
- **Product-internal verdict-label inconsistency, re-confirmed still open.**
  Same finding as 2026-08-27 below, checked again today and still true: every
  agent's **Profile tab** "The bar" table shows "Review required" / "Block
  recommended," while the **Score tab** and (newly checked this pass) the
  **back-office Home** worklist both show "Needs work" / "Don't ship
  (recommended)" for the identical band. This is the same rename from
  2026-08-27's `scorecard`/`glossary` fix - the Profile tab's own table still
  never got it, two weeks later. Direction: **product-should-catch-up** (still
  the Profile tab's table that's stale, not the docs). Also folded into
  `docs/documentation/agent-score-0-to-1-runbook.md` §3.7 for the internal
  audience.
- **`dimension-hierarchy.png` diagram still shows retired profile names**
  ("e.g. RAG, Tool-Orchestrator, Conversational," baked into the exported image
  from `src/assets/excalidraw-src/dimension-hierarchy.excalidraw`). Not fixed
  this pass - correcting it means editing the Excalidraw source and re-exporting
  the PNG, out of scope for a text-focused pass. Direction:
  **docs-should-update**. Severity: low (illustrative example list, not primary
  content) - deferred to next run.
- **`eval-catalog`'s "Faithfulness (EvalClaw)" screenshot alt text** - not
  independently verified this pass. The eval catalog lives in the back office,
  which wasn't part of this walk's focus; PR #598's body doesn't mention EvalClaw
  either way. Left as-is, unconfirmed.

---

## 2026-08-27 — GitHub merge scan + production walk, using AgentScore Updates.md

Cross-checked `docs/updates/AgentScore Updates.md`'s Aug 26/27 entries against a
GitHub merge scan (24 PRs merged on `Tricentis-AI/agent-score` since the
`.last-github-sync` marker of 2026-08-26T15:00:06Z) and a fresh Playwright walk of
production, logged in as a superadmin.

**Merge scan:** of 24 PRs, the customer-facing/billing-visible ones (LLM catalog
pricing + the OpenAI cached-token double-billing fix, the new internal usage/spend
report, the trace-assembly rebuild, the bad-span-type fix) were all already written
up in `AgentScore Updates.md`'s Aug 27 entry - none require a `docs-src` change,
since none of that work touches anything the onboarding docs describe (it's
internal admin/billing tooling). The rest (DB migration fix, ingest concurrency,
infra vCPU bump, `agent-tools` bounded-tool-surface groundwork with no transport
yet, ECS diagnostics) are internal-only. No `docs-src`-relevant PRs found beyond
PR #407 (already logged below, still open).

**Resolved this pass** (docs edited, see CHANGELOG 0.36.0):
- `scorecard`, `glossary` - verdict names were stale: docs said Ship / Ship (with
  note) / Review required / Block recommended / Block. Live Score tab badges and
  the Activity/Runs table now show Ship / **Ship with note** / **Needs work** /
  **Don't ship (recommended)** / Block. Confirmed live across three different
  agents and cross-checked against the Activity tab's Runs table for the same
  scores. Direction: **docs-should-update**. Severity: high.
  - Note: **"Needs work" is not a new term** - the 2026-08-24 entry below records
    it being *removed* from a screenshot as stale prototype wording ("61/100,
    Needs work, 24 below") believed not to reflect the real product. It turns out
    that wording shipped for real between then and now. Worth remembering next
    time a screenshot looks like it's using "placeholder" copy - it may be a
    preview of what's coming.
- `connect-your-agent` - closes the **"Connect an agent" wizard** gap first
  flagged 2026-08-26 (see below) and left unapplied at that review gate. Added a
  screenshot and callout for the Agents page's + Add agent → guided tenant-key +
  exporter-config modal. Also corrected the doc's stated reason for using the
  `_TRACES_`-suffixed OTel variables (was: separates traces from logs/metrics;
  actually: prevents `/v1/traces` from being appended to the ingest path twice) -
  the real reason is now shown directly in-app in that same wizard. Direction:
  **docs-should-update**. Severity: medium (wizard gap), medium (wrong rationale).
- `agent-card` - screenshot caption quoted "Synthesized by the judge model";
  live copy reads "Synthesized by the model" (no "judge"). Direction:
  **docs-should-update**. Severity: low.
- `scorecard` - added a short section on the predictive score range and
  "close to the line" callout the Score tab shows near a verdict boundary
  (e.g. "Score another sample and you'd likely get 66-80"), previously
  undocumented. Direction: **docs-should-update**. Severity: low.

**Still outstanding (not touched this pass):**
- **PR #407 structural finding** (below, 2026-08-26) remains unresolved - user
  direction this run was again to keep auditing/editing `docs-src` as-is and treat
  ownership of the customer docs (`docs-src` vs. the in-app ported copy) as a
  separate decision. Reconfirmed live: both `https://agent-score-customer.product.tricentis.com/docs`
  (the ported in-app copy) and the old standalone docs site both return 200 today.
- Could not confirm the live label for the 0-39 ("Block") band - found no agent
  scored below 40 during this walk. Left as "Block" (unchanged) on the assumption
  the rename pattern (Ship with note / Needs work / Don't ship (recommended))
  didn't touch the bottom tier, but this is unverified.
- **Product-internal inconsistency, logged only, no doc action:** the same
  agent's **Profile tab** "The bar" verdict-bands table still shows the *old*
  labels ("Review required", "Block recommended") while its Score tab and
  Activity log use the new ones for the identical score. The docs' own
  `profile-tab.png` screenshot (still showing "Review required") is therefore
  still an accurate capture of that specific tab - only the Score-tab-facing
  Scorecard/Glossary pages needed the update. Direction:
  **product-should-catch-up** (the Profile tab's own table is stale, not the
  docs).

---

## 2026-08-26 — GitHub merge scan + production walk (Playwright, multi-agent)

First run using the new step-3 GitHub merge scan (added to the `agent-score-docs-sync`
skill this session). Scanned 92 PRs merged on `Tricentis-AI/agent-score` since
2026-08-12 (no `.last-github-sync` marker existed yet, so used the 14-day default).
Kept 3 as customer-facing/onboarding-relevant, dropped the other 89 as internal
infra/back-office/scoring-pipeline work (the Langfuse → Postgres + object-store
migration, skills tooling, ops/alerting, etc.).

**⚠️ Structural finding, not a per-page discrepancy - flagged prominently per user
direction:**
- **PR #407** (`feat(customer): add a Docs section to the customer app`, merged
  2026-08-26) ports all 10 guide pages and 7 diagrams from **this project**
  (`agent-score-marketing/docs-src`) directly into the `agent-score` repo's customer
  app frontend as hand-edited source, rendered at a new `/docs` nav-rail item. The
  PR description calls `docs-src` **"the retired ... project"** and the port
  **"a one-time port, not an ongoing sync."** Confirmed live in production today:
  logging in and opening the book icon (the new 4th nav-rail item) shows `/docs`
  with the identical nav structure and Welcome-page copy this project currently
  has. **This means the docs this skill audits and rebuilds are no longer
  guaranteed to be what real customers see in-product** - the source of truth for
  onboarding docs may now be inside the `agent-score` repo, which this skill has
  no access to edit. User direction this run: keep auditing/editing `docs-src` as
  before, but surface this for a separate decision (retire `docs-src`, redirect its
  published site, or repoint this skill at `agent-score`).

**New findings this pass, pending review-gate approval:**
- `connect-your-agent` - undocumented **"Connect an agent" dialog**: the Agents
  page's "+ Add agent" button opens a guided 4-step modal (pick the tenant → see
  its ingest key → exporter config with a copy-button env-var block → "what
  happens next") that covers most of what the doc currently only describes via a
  separate trip to the Integrations page plus manual OTel instructions. Also
  confirms PR #393's fix is live: the tenant picker now includes zero-agent
  tenants (`andrew-new-tenant` was selectable and showed its key), where before
  that PR the picker excluded exactly the tenant a first-time user needs.
  Direction: **docs-should-update**. Severity: high (a real, prominent, live entry
  point is completely undocumented).
- `dimensions-and-profiles` - **advances open item #7** (2026-08-17, still open as
  of 2026-08-24): the "ships seven profiles" claim is stale. Two different live
  agents (`jira epic poller`, `overlap-cap3-test_delay_agent (2)`) are scored
  against a profile named **"General Starter v1 (Auto)"** - not one of the seven
  named profiles, and not the "Default v1" name seen on 2026-08-17 (renamed since,
  or a second undocumented fallback). Assigned when "evidence diversity 1.000
  still below the 3.0 threshold." Carries exactly 4 dimensions (Correctness,
  Relevance, Safety, Quality Efficiency), weight 1 each, 1 eval each - much
  simpler than the doc's description of a full weighted profile. This is likely
  the *first* profile most newly-connected agents actually get. Direction:
  **docs-should-update**. Severity: high (affects most fresh agents, per both
  examples seen).
- Screenshots showing the customer-app sidebar are stale by one icon across every
  page that has one (`welcome`, `connect-your-agent`, `dimensions-and-profiles`,
  `scorecard`, `scoring-over-time`, `agent-card`) - production's nav rail now has
  4 icons (Agents / Integrations / Settings / the new Docs book icon from PR
  #407), confirmed directly against `integrations-tab.png`. Direction:
  **docs-should-update**. Severity: low (cosmetic, but touches 6 images).
- `scoring-engine` vs `glossary` - **docs-internal inconsistency**, found reading
  step 2, not a prod comparison: Glossary's "Judge model" entry says "You choose
  which provider and model to use," directly contradicting `scoring-engine`'s own
  (already-confirmed-accurate per 2026-08-18 item #10) statement that provider
  choice "isn't yet a self-serve setting in the app." Direction:
  **docs-should-update** (reword Glossary to match `scoring-engine`). Severity:
  medium.

**Noted, not actioned (pending-verification):**
- PR #411 (`feat(llm-catalog): LLM Inference catalog — rename, cache pricing,
  per-task routing`) renames the back-office judge-model concept and adds
  per-task routing, but the rename is back-office-only (`/admin/judges` →
  `/admin/llm-inferences`) - nothing customer-facing changed yet. Worth
  re-checking on a future pass in case it's a precursor to customer-facing
  judge-model choice, which would finally resolve the glossary/scoring-engine
  contradiction above in the other direction.
- PR #347 (self-service API key management) was flagged by the merge scan but
  already matches what `connect-your-agent` documents today - good corroboration,
  no action needed.

**Confirmed accurate this pass (no change needed):** the Integrations page
(tenant selector, API keys table, New key / Rotate / Revoke), the Score tab
(composite score, verdict, confidence band, scored/skipped/failed/retired
counts), the Agent Card tab ("Synthesized by the judge model" wording, behavioral
patterns/success criteria/failure modes), the Profile tab's Autonomous scoring /
cadence (60 min minimum) / lookback (1-90 days) controls, the Activity tab's
run timeline, and `/settings` as the Account page.

---

## 2026-08-24 — internal-agent onboarding + screenshot refresh (Back Office + customer app, Playwright)

Triggered by updating `connect-your-agent`'s internal-agent-ingestion steps against
`docs/documentation/internal-agent-onboarding-runbook.md`, then auditing the rest of
the site against production while in there.

**Resolved this pass** (docs edited, see CHANGELOG):
- Internal Tricentis agents were documented as "ingested automatically - nothing to
  configure," which is stale. Replaced with the real manual, region-split,
  BetterStack-pull process from the runbook (4 steps), confirmed directly against
  the Back Office App's Ingestion > Stream > Configuration page (Services - OTel
  service.name tag list, Save configuration) - matches the runbook exactly. Added
  two new real screenshots: the `service.name` attribute in a BetterStack trace,
  and the Back Office Configuration section.
- `welcome` - `agents-cards.png` was the "CUSTOMER WEB APP · BASELINE"
  design-prototype tool (same root cause as #9 below/2026-08-18), showing
  fabricated dimension names (conversational/relevance/safety w/ decimal
  weights) that don't match the product's real dimension set. Replaced with a
  genuine capture of the live Agents cards view.
- `connect-your-agent` - `integrations-tab.png` was stale (old tenant selector,
  old key data) though the self-serve API-key prose was already confirmed
  accurate. Refreshed with a genuine capture (no tenant selector in the current
  single-tenant customer view).
- `scorecard` - `scorecard-tab.png` was still a Baseline prototype ("61/100,
  Needs work, 24 below," "pass bar and pass rate" language). Replaced with a
  genuine Score tab capture (100/100, Ship, dimension-weight breakdown) and
  corrected the alt/caption text to match what's actually shown.
- `scoring-over-time` - `activity-tab.png` was a Baseline prototype implying a
  Runs table with separate Change/Revision columns. Real Runs table columns are
  When/Trigger/Score/Scored/State (verdict is an inline badge next to Score,
  not its own column). Replaced screenshot and corrected the claim. Cadence
  (60 min minimum), lookback (1-90 days), and the Autonomous scoring toggle
  were all re-confirmed accurate live.
- `eval-catalog` / `custom-evals` - `catalog-door.png` / `entry-doors.png` were
  genuine captures but from a visibly older Back Office build (old nav, "Lior
  Nabat" login, different eval counts). Refreshed both against the current
  build (62 evals; "32 metrics · 3 templates" entry screen) - no prose changes
  needed, the "Create an eval" copy is verbatim identical live.
- Docs-site version bumped to `0.34.0` per user request, to track the
  AgentScore product version rather than the docs site's own semver.

**New finding, resolved as product-should-catch-up (no doc edit)**:
- `dimensions-and-profiles` - `profile-tab.png` is the same Baseline prototype
  tool as the items above (numeric "Fit score 0.82," an "Evidence diversity:
  4.2 distinct behavioural signatures" field, and a percentage weight bar with
  an "(excluded)" tag). Confirmed live on a real scored agent: the actual
  Profile tab has none of this - just a plain-language "Why this profile"
  paragraph and a simple table with integer `weight 1` values, no bar chart.
  Unlike the other Baseline-prototype cases above, **the user confirmed this
  richer version is the intended target design**, not a docs error - so the
  doc is left as-is (screenshot included) and this is logged purely as a
  product gap: the real Profile tab needs to grow a numeric fit score,
  evidence-diversity metric, and a weighted-bar dimension view to match what
  the docs already (correctly) describe.

**Resolved this pass (second round)** - docs edited, see CHANGELOG:
- `eval-catalog` (Library/G-Eval/Hybrid sections) and `custom-evals` ("Test
  before you trust it," "Nothing changes silently") - the "Live preview" panel
  question above is now resolved: **user direction is docs-should-update.**
  Checked three more surfaces looking for it (the Catalog card's detail modal,
  the "Run" button's destination, and a real agent's own Traces tab) and it
  exists nowhere as the inline docked score-gauge/PASS-FAIL/Agree-Disagree/
  version-diff experience the docs depicted. Trimmed both pages to match
  reality:
  - `eval-catalog` - dropped the Library section's screenshot entirely (no
    real capture exists of a Library eval's detail view - still needed, see
    below). Replaced the G-Eval and Hybrid screenshots with real detail-view
    captures (`studio-geval.png` now shows the "Template: Helpful, On-Point
    Answer" rubric + threshold; `studio-hybrid.png` now shows "Security
    Findings"'s real MAP/REDUCE breakdown) and rewrote the alt/caption text to
    describe what's actually shown - no more "live preview scoring 0.71" or
    "citing three grounded claims as evidence" language.
  - `custom-evals` - "Test before you trust it" now describes the real
    **Runner** tool (pick an eval, tenant, and agent; run against that agent's
    already-captured traces) with a genuine screenshot, replacing the
    fictitious inline trace-picker. "Nothing changes silently" was trimmed to
    just the confirmed-real fact (publishing creates a new immutable version;
    past grades stay attributed to their version) and dropped the
    diff-against-last-version / side-by-side score comparison / "what the
    judge saw" transparency-panel claims and screenshot, none of which exist
    today.
  - Deleted the now-unused `studio-library.png`, `studio-tracepicker.png`,
    and `studio-diff-transparency.png` asset files.

- `eval-catalog` - Library section now has a genuine capture too
  ("Template: Safe, Non-Toxic Output" derived from the `toxicity` library
  metric) after the browser session was relaunched.
- Added an explicit callout to both `eval-catalog` and `custom-evals` stating
  the catalog/builder/runner live in Agent Score's Back Office and are
  maintained by the Agent Score team, not a customer self-serve surface -
  the prior prose read as if the customer clicks through these themselves.

**Still open**:
- `custom-evals` - `guided-author.png` (the "Guided author" AI-assisted
  drafting flow, reachable via the "Start with AI" button on the "Create an
  eval" screen) was not run end-to-end this pass (time/API-call cost) -
  flagged for a follow-up verification, not yet trusted either way.

---

## 2026-08-18 — follow-up audit + fixes (Playwright walkthrough, multiple tenants)

Continuation of the 2026-08-17 audit below. Confirmed several of that audit's
open items firsthand and fixed the ones the user approved.

**Resolved this pass** (docs edited, see CHANGELOG):
- #1 (API key naming + self-serve gap) - confirmed directly: `/integrations`
  has full self-serve New key / Rotate / Revoke, tenant-scoped, `tk_` prefix.
  This is a **brand-new feature**, not just a naming fix - docs previously told
  customers to ask the team for key rotation, which is no longer true.
- #2 (VPN-only ingest) - added.
- #3 (agent states) - corrected to Setting up -> Learning your agent (n/20) ->
  Scored / Needs attention.
- #4 (OTel specifics) - added exact env var names and the bearer-token header
  format.
- #8 (schedule specifics from the older list's #8) - added cadence/lookback
  constraints and the Autonomous scoring toggle.
- #10 (scoring-engine page) - confirmed judge-model choice and a usage log do
  **not** exist anywhere in the customer app (checked Profile, Agents,
  Integrations, Settings). Pass thresholds are real, confirmed live on each
  agent's Profile tab. Reframed the doc accordingly.
- #9 (Agent Card latency/cost envelope) - **root cause found**: the doc's
  screenshot (`agent-card-customer.png`) was captured from an internal
  design-prototype tool (visible "CUSTOMER WEB APP · BASELINE" toolbar in the
  original image), not the live product, and was mislabeled as "an actual
  Agent Card from the Agent Score app." Confirmed on two different live agents
  that no latency/token/cost figures render anywhere on the real Agent Card.
  Replaced the screenshot with a genuine capture and removed the envelope
  claim from the prose. The envelope itself is a real design intent that was
  never built - logged below as a product gap, not restored to the docs.

**New finding (not yet actioned):**
- #11 - eval-catalog's family table lists "Tool Correctness" and "Argument
  Correctness" under the "Agentic & Tool-use" family. On a live profile
  (rag-support-agent, Tool/Orchestrator Starter v2), both evals are actually
  assigned to the **correctness** dimension, not agentic_tool_use. Direction
  unclear - the catalog's "family" may be a browsing taxonomy independent of
  a profile's dimension assignment, which would make this not a bug. Held for
  a broader check before editing either the docs or flagging it as a product
  issue.

**Still open from 2026-08-17** (not touched this pass):
- #5, #6 (verdict-label / letter-grade inconsistencies) - product-should-catch-up,
  intentionally left as-is per direction-of-truth rules.
- #7 (profile naming / undocumented "Default v1" profile) - needs the broader
  multi-tenant pass the original audit flagged.

---

## 2026-08-17 — audit (Playwright walkthrough, tenant: andrew-test-tenant + fleet view)

Scope note: audited the connect flow, the Agents dashboard, one scored agent's
Score / Agent Card / Profile / Activity tabs, and Account settings. Items 7, 9,
and 10 need a broader multi-tenant pass to fully confirm.

| # | Doc page | Docs say | Production shows | Severity | Direction |
|---|----------|----------|-----------------|----------|-----------|
| 1 | connect-your-agent | "API key" (team "mints your first API key") | Called an **ingest key**, prefix `tk_`, one per external tenant | High | docs-should-update |
| 2 | connect-your-agent | No network restriction mentioned | "The ingest endpoint is reachable over the **Tricentis VPN only**." | High | docs-should-update |
| 3 | connect-your-agent | Agent appears in a **"Collecting data"** state | Real states: **"Setting up"** (0 traces) → **"Learning your agent" (n / 20 traces)** → **"Scored" / "Needs attention"** | High | docs-should-update |
| 4 | connect-your-agent | "two additional lines added to an exporter" (no specifics) | Exact env vars shown: `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT=…/external/otel/v1/traces` and `…_TRACES_HEADERS=Authorization=Bearer <tk_…>`; warns to use the `_TRACES_`-suffixed form | Low (enhance) | docs-should-update |
| 5 | scorecard / welcome / glossary | Verdict labels: **Ship / Ship (with note) / Review required / Block recommended / Block** | Per-run + score-header labels customers see: **Ship / Ship with note / Needs work / Don't ship (recommended) / Don't ship**. NOTE: the Profile "bar" view still uses the formal Review/Block labels — the **product itself is internally inconsistent** and should be reconciled | High | product-should-catch-up (reconcile the two label sets) |
| 6 | welcome / glossary | "a 0-100 score, **a letter grade**, and a ship/review/don't-ship recommendation" | **No letter grade** anywhere — score + verdict only | High | product-should-catch-up (docs promise a grade the product doesn't yet render) |
| 7 | dimensions-and-profiles | Ships **seven** profiles: RAG, Computer-Use, Conversational, Tool-Orchestrator, Code, Structured-Generation, EvalClaw | Observed naming: **"… Starter v<n>"** (Tool / Orchestrator Starter v2, Code Starter v1, Structured Generation Starter v1) **plus a "Default v1"** profile docs never mention. RAG / Computer-Use / Conversational / EvalClaw not seen in this tenant set | Med (verify full catalog) | mixed — docs naming stale; "Default" profile undocumented |
| 8 | scoring-over-time | "Set an interval… in minutes" + generic "lookback window" | **Cadence (minutes), min 60**; **Lookback (days), 1–90**; plus an **"Autonomous scoring"** toggle and inherit-the-global-default behavior | Med | docs-should-update |
| 9 | agent-card | An **"Inferred" badge** marks judge interpretations; card carries **latency and cost envelopes** alongside observed tools | Purpose labeled "**Synthesized by the judge model — a draft, not a verified declaration**"; tools note "Descriptions are inferred." **No latency/cost envelope** visible on the card | Med (verify) | mixed — badge wording stale (docs); envelope may be product-should-catch-up |
| 10 | scoring-engine | Reads like a dedicated "Scoring engine settings" area (pass thresholds, judge model, usage log) | `/settings` is an **Account** page (identity, tenants, change password). Thresholds live **per-profile** (Profile tab). Judge-model / usage-log UI not found — location unconfirmed | Med (verify) | docs-should-update (relocate/reframe) once location confirmed |

### Additional product observations (not yet in docs)
- Score tab surfaces a **confidence band** ("Score another sample and you'd likely get 64–78"), a **Partial / Provisional run** concept, and eval-count breakdown (**scored / skipped / failed / retired**) with a "**Why evaluations failed**" explainer stating failures shrink evidence rather than lower the score.
- Agent detail URL is **`/tenants/<tenantId>/agents/<agentId>`** (not `/agents/<id>`).
- Activity tab shows a full run history with per-run trigger (manual / scheduled / rescore), score, verdict, scored count, and state (complete / partial).

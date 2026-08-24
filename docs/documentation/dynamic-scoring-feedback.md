## Sessions

**My understanding:** The underlying bet: grading should be a deliberate, scoped act, not
something that happens to everything we see automatically. A session lets a user (or a sampling
policy) say "this is the unit I want judged," instead of leaving us to guess where one interaction
ends and the next begins. The three boundary tiers read less like three equal options and more
like a maturity ladder: start manual, graduate to a declared attribute once telemetry supports it,
fall back to inference only when neither is available.

**The good**
- This solves a real, immediate problem: knowing what to evaluate is hard today, and the session
  concept gives users a way to say "grade *this*."
- The three session types (discovery, grading, reference run) as delimited scoring runs is a clean
  model and maps to how teams work: explore, test, baseline.
- Curation at close (see the traces you're about to grade, remove intruders, before spending
  money) and the retroactive/unassigned-trace bucket are the right defaults for agents that
  arrive with no session concept at all.

**Open issues/questions**
- The autonomous-agent story is still thin. Manual bracket via an MCP tool call implies something
  triggers open and close, but for an agent running unattended with no human test operator, that
  something isn't specified. Worth a concrete example in spec: who or what calls the MCP tool for
  a fully autonomous agent?
- The declared-id tier removes the "no standard" problem but not the onboarding cost: if a
  customer's telemetry doesn't already carry a usable id, they still need an instrumentation
  change. This adds friction and we will have to stop saying "just add two lines of code" for agents that need this tier.
- Inferred timing-gap boundaries are deferred with no detail, and task- or intent-based boundary
  detection (my original suggestion) isn't on the roadmap at all. Worth a decision now: out of
  scope for good, or revisit post-launch, rather than leaving it implicit.
- The unassigned-trace bucket needs to prove itself at real scale. "Counts, time filters, bulk
  selection" is the right shape, but customers with hundreds of agents and no session id will
  generate a lot of unassigned traffic; this deserves UX validation, not another description.

---

## Scorecard

**My understanding:** The load-bearing decision in the whole proposal lives here: the owner
defines quality by what they say matters, captured once as a structured artifact, not inferred
from what the agent happens to produce. Everything else in this document (the trust block, the
versioning discipline, the per-axis cost tradeoff) exists to protect that one artifact from
drifting out of sync with either the agent or the owner's intent. Treating it as versioned and
immutable states that scores are only meaningful relative to a specific, citable definition of
"good," not a floating number.

**The good**
- This is the highest-impact piece of the proposal. Accurate, agent-appropriate scoring is the
  precondition for AgentScore being trusted at all.
- The required traffic light, defined in the card's own terms but shown identically everywhere,
  is the right way to give management a one-glance answer without forcing every agent into the
  same rubric.
- Deriving axes and rubrics from the interview rather than from observed output is a subtle,
  important call: a rubric learned from the agent's own outputs would define "good" as "what it
  already does," and punish real improvement. Glad to see this stated as a principle rather than
  left implicit.

**Open issues/questions**
- *How is the traffic light computed: transparent, customizable?*
- *What's different from what we have today?*
- Chat-refinement mechanics (what the chat can change, and how an edit becomes a new version) are
  called out in the source doc as unspecified. This is the primary surface owners will touch
  after the initial draft; I'd prioritize this in spec over lower-traffic details.
- Axis count has guidance ("fewest axes that separate the failure modes described") but no hard
  limit, and every axis is a recurring cost on every graded session. Recommend a soft cap or a
  live cost-preview nudge during drafting so owners feel the cost of each axis as they add it.
- Reference material (Part 2) has a size cap and per-call token budget, but no stated versioning
  story: if an owner updates their requirements list, does that force a new scorecard version, or
  can reference material change independently of the rubric? Worth clarifying: it changes what
  "old grades stay frozen on their version" means in practice.

---

## Cost and budget controls

**My understanding:** The premise: the anxiety customers have about AI spend isn't about the
dollar amount, it's about not knowing the amount until after it's spent. This section solves that
by moving the expensive commitment point (the real judge-call price) to *after* the point where
we already know the number, leaving only the vague estimate on the cheap side of that line. The
daily cap and "deferred, not dropped" framing extend the same idea from a single session to an
agent's ongoing spend ceiling.

**The good**
- This is the other proposal I'd call a must-have. Transparent, predictable AI spend is a real
  retention lever; customers have told us this themselves.
- Rejecting a single "cost per quality point" ratio is the right instinct: that number
  would change meaning every time a card is edited and would blow up at the low end. Two axes
  over time is the honest version of the same insight.

**Open issues/questions**
- *How accurate is the price prediction?*
- *Can we sample instead of grading everything?*
- The coverage indicator ("usage present on 84% of spans") discloses the gap but doesn't say what
  action follows from a low number: does grading proceed anyway, or is there a floor below which
  we warn the owner the cost figure isn't trustworthy? Worth deciding before this ships, since
  "≥ $X, 3 spans unpriced" will read as a bug to a customer unless the UX explains why.
- What happens when an agent is *chronically* over its daily cap: does deferred grading pile up
  indefinitely, or is there prioritization/backfill logic? Not addressed.
- The sampling confidence-margin math is listed as an open item in the source doc, but it's the
  crux of the pricing and verdict-stability promises we're making in this same document. I'd pull
  this forward as an early spec priority rather than treat it as a late-stage detail.

---

## Discovery and the owner interview

**My understanding:** This section answers the question the whole proposal is about: where
does the rubric come from in the first place? Watching traffic only earns the right to ask better
interview questions. It never gets to answer them itself. That's a deliberate refusal to take
the easy path (infer quality from behavior), because the easy path already failed us with the
test-case agent. Calling the first version provisional is an honest admission that the traffic
available at that point (developer smoke tests) is a bad proxy for real usage, and the system
should say so rather than pretend day-one confidence.

**The good**
- This is the direct fix for the problem that motivated the whole proposal: our test-case agent
  scored as a chatbot. An interview-driven draft would have caught that on day one.
- Calling the first version provisional, and building a shape-drift indicator that compares live
  traffic against the discovery baseline, is an honest acknowledgment that discovery traffic
  (developer smoke tests) is the least representative traffic an agent will ever produce.

**Open issues/questions**
- The interview is now the single point of failure for scorecard quality, and the interview
  question templates per discovered agent shape are listed as unspecified. A generic or rushed
  interview produces a weak draft with no stated fallback.
- If we're telling owners upfront that the first scorecard version is likely to need revision,
  should the first billed grading run under it be free or discounted? Right now the doc implies
  owners pay full price to validate a card we already expect to redo.
- The shape-drift indicator "prompts a review," but doesn't say who owns acting on it or on what
  cadence. Without an owner, this risks becoming a banner nobody clears.

---

## Trust and judge validation

**My understanding:** This is the section that most changes what AgentScore *is*. Today the judge
is an unquestioned authority: we've never had a mechanism to catch it when it's wrong. What's
proposed here is an admission that a judge applying a stable-but-wrong rubric will agree with
itself forever, so the only real test is trying to fool it on purpose (rewording, damaging,
injecting) rather than watching it repeat itself. That reframes "trust" as something earned
through adversarial testing, not something assumed because the model is capable.

**The good**
- This is a new capability, not a refinement of something we have. It answers "how do we know
  the judge is measuring the right thing," which today we don't ask.
- Grading the owner's item *before* showing the judge's verdict, to avoid an anchoring trap, is a
  small design choice that prevents a real and easy-to-miss bias.
- Treating "not yet validated" as a warning with a next action rather than a hard gate keeps the
  product usable while staying honest about confidence. The right trade-off.

**Open issues/questions**
- Twenty blind labels at 80% agreement is presented as the default ladder, but I don't see it
  validated against real customer behavior: will an owner sit down and blind-grade 20 items per
  scorecard? This assumption is worth pressure-testing with design partners before it's the
  number customers see on every new card.
- The sensitivity check requires a known-good item damaged on purpose, but it's not specified
  who authors the damage (auto-generated, owner-provided?). The check is only as meaningful as
  the damage variant's quality.
- The injection canary is labeled a smoke test that "catches naive attacks only," with the real
  defense being structural prompt separation, work that isn't scoped here. Exec messaging should
  reflect that distinction and not oversell this as injection-proof.

---

## Improvement guidance

**My understanding:** This is the section that justifies charging for any of this: a score by
itself is a number, this is what turns it into a reason to keep paying. The three tiers are
structured as an escalating burden of proof: diagnosis points at evidence we already produced,
but a recommendation has to name what it will move, and isn't believed until a rerun proves it
moved. That's a much higher bar than most "AI-generated suggestions" features hold themselves to,
and the right one.

**The good**
- Banning vague recommendations like "improve your prompt" is a concrete, enforceable quality
  bar: the difference between a report someone acts on and one they ignore.
- Recording the fully-resolved judge model identifier on every grade, to separate "a provider
  silently updated the judge" from "the agent regressed," is a mature safeguard I wouldn't have
  thought to ask for.

**Open issues/questions**
- Verification means rerunning a session to test a hypothesis. Does that rerun count against the
  daily cap and get billed like any other grading run? If so, "verify this recommendation" is
  itself a spend decision the owner has to make, and that friction isn't called out anywhere.
- No stated behavior for when a recommendation is applied and the named axis doesn't move, or
  moves the wrong way. Does confidence in future recommendations from that axis get discounted,
  or does the system keep proposing more unproven ones?

---

## Security and privacy

**My understanding:** The judge here is treated as an attack surface, not only a measurement
tool. Anyone whose content gets graded (an end user, or the team being measured) has an incentive
to steer the score, and the design responds to that as an adversarial relationship rather than a
cooperative one. The evidence-as-reference and provider-allowlist choices read the same way:
they're framed less as privacy nice-to-haves and more as trust prerequisites for regulated
customers to let us near their data at all.

**The good**
- Reference-based evidence (span id plus offsets, resolved at render time) is the right call for
  both privacy and correctness: it avoids stale copies and makes deletion mean deletion.
- The per-tenant judge-provider allowlist gives customers real, auditable control over where
  their data goes. This is worth surfacing to the exec team as a compliance and sales
  differentiator, not only an engineering safeguard.

**Open issues/questions**
- The allowlist decides which providers *may* see trace content, but I don't see a stated default
  for a brand-new tenant before they've configured anything. This should be fail-closed by
  default, and that should be stated as policy rather than assumed. A fail-open default here
  would be a real incident, not a rough edge.
- The "published attacks on judge architectures exceed 30% success" figure is a strong claim.
  Before it goes into any exec or customer-facing material, it needs a citation attached.

---

## Consolidated questions 

1. What's the concrete trigger story for session boundaries on a fully autonomous, unattended
   agent? Who or what calls open and close?
2. Is the 20-labels / 80%-agreement trust ladder validated against real owner behavior, or is it
   a starting guess we should pressure-test with design partners first?
3. Can scorecard drafting and the improvement loop start before the trace-store migration
   completes, given they read through the same interface either way?
4. What's the migration story for existing customers' historical scores when the old
   profile/fitter vertical is deleted at cutover?
5. Should the first billed grading run under a scorecard we already expect to be provisional be
   discounted or free?



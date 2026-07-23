**Goal:** Validate target user, the "ready to ship" problem, deployment constraints, and willingness to pay. Use the same script across all six to eight interviews so synthesis is comparable.

**Length:** 45 minutes. Leave 5 minutes at the end for the customer's own questions.

**Recording:** Ask for consent. If denied, take notes only. Default to consent for the first attempt.

## B.0 Pre-interview prep (5 min before)

- Confirm role and team size from LinkedIn or Chris Colosimo's notes.
- Note which agent platform they have mentioned (n8n, Zapier, LangChain, custom, Agentforce, SAP Joule).
- Have your three top hypotheses written down. After the call, mark each one validated, invalidated, or unclear.

## B.1 Warm-up (5 min)

1. "Tell me about your role and what your team owns."
2. "How long have you been working on AI agents specifically?"
3. "What does a typical week look like for you right now?"

## B.2 Current state of their agent work (10 min)

4. "Walk me through the most recent agent your team shipped, or is about to ship. What does it do?"
5. "Who built it? What tools or platforms did you use?"
6. "Roughly how many agents do you have in development versus in production today?"
7. "Who on the team decides when an agent is ready to go live?"

_Listen for: DIY vs. platform, build vs. buy, where the decision authority actually sits._

## B.3 The shipping readiness problem (15 min)

8. "Think about the last time you had to decide whether an agent was ready to ship. How did you make that call?"
9. "What signals or metrics did you look at? Were any of them quantitative?"
10. "What did you wish you had known that you didn't?"
11. "After shipping, did anything surface in production that you didn't catch in testing? What was it?"
12. "How do you measure whether the agent is actually saving time or money once it's live?"
13. "If you could see one number on a dashboard that told you 'this agent is ready,' what would you want it to measure?"

_Listen for: gap between current eval tools and shipping confidence, role of cost and UX vs. accuracy, whether they think in test semantics._

## B.4 Current tools and gaps (5 min)

14. "What evaluation tools are you using today? LangSmith, Langfuse, Braintrust, internal stuff, none?"
15. "What works about them? What doesn't?"
16. "If a tool gave you a pass/fail readiness verdict on every agent build, would you trust it? What would it take for you to trust it?"

## B.5 Deployment and data constraints (5 min)

17. "Where does your agent's telemetry go today? Datadog, internal logs, the vendor's platform?"
18. "If we asked you to send eval data to a Tricentis cloud service, what would your security or legal team say?"
19. "Would self-hosted, VPC, or on-prem be a hard requirement, a nice-to-have, or unnecessary?"
20. "Has data residency ever killed a tool purchase for your team?"

_Listen for: whether on-prem is real demand or theater. Quantify if you can._

## B.6 TCoE and organizational fit (3 min, only if relevant)

21. "Does your organization have a Testing Center of Excellence or a QA function? Are they involved in agent work?"
22. "Who would own evaluation results in your org - the builders, QA, or someone else?"

## B.7 Willingness to pay and close (2 min)

23. "If this tool existed and worked the way you described, how would your team buy it? Seat-based, usage-based, platform license?"
24. "Who else on your team or at your company should I talk to?"
25. "Anything I should have asked but didn't?"

## B.8 Post-interview (within 24 hours)

- Fill out the synthesis row in the interview tracker spreadsheet:
    - Validated / invalidated / unclear for each of the three pre-call hypotheses
    - Strongest quote (verbatim)
    - Biggest surprise
    - Likelihood they would pilot (1-5)
- Send a thank-you note. If they offered an intro, follow up within 48 hours.

## B.9 What you are listening for across all interviews

By interview six, you should be able to answer:

1. Is "ready to ship" a real problem they articulate unprompted, or only when you ask about it?
2. Is the buyer the agent builder, the TCoE, or someone else?
3. Is on-prem a deal-breaker for what fraction of accounts?
4. Do they already have a tool that does most of this, and if so, what is missing?
5. Would they pay for evaluation as a standalone service, or only bundled into a larger platform?

If you cannot answer these by interview six, the script needs to change, not the sample size.
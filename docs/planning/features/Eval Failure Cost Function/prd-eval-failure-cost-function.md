Core idea: score severity, not just pass/fail

Today a failed eval costs the same as any other failed eval. A cost function weights each failure by what it would cost the customer's business, then reports expected loss next to the 0-100 score.

Per failure:

cost(failure) = severity_tier × likelihood × exposure

- Harm category (the tag you mentioned): reputational, regulatory/compliance, financial loss, data leakage/privacy, safety, operational disruption, legal/IP.
- Severity tier (1-5): from "cosmetic" to "reportable incident."
- Likelihood: from the eval itself. A failure rate of 3/20 runs is a rate, not a binary.
- Exposure: how often the agent hits that scenario in production (customer-supplied volume, or a default by agent type).

Make it useful, not just visible

1. Tag every eval with 1-2 harm categories plus a default severity. This is a one-time mapping of the 41 evals, so it's cheap to start.
2. Customer-configurable weights. A bank weights regulatory 10x. A consumer app weights reputational. Ship presets (Financial Services, Healthcare, Retail, Internal Tools) so there's no blank-page problem.
3. Optional dollar calibration. Let them enter rough costs per category (e.g. "a PII leak costs us $X"). Output becomes "expected annual exposure: $Y" instead of an abstract index. Keep it clearly labeled as an estimate, or you'll get challenged on the numbers.
4. Show it as a risk breakdown. Use a stacked bar or heatmap by harm category, with the top 3 failures ranked by cost. A 78/100 agent with one critical regulatory failure should read very differently from a 78 with many cosmetic ones.
5. Gate on severity, not just score. Any tier-5 failure caps the verdict (e.g. "Not ready" regardless of score). This also fixes the issue where an average score hides a catastrophic failure.
6. Trend over time. Show cost-weighted risk per release, so teams can see whether a model or prompt change moved risk.

Caveats to decide up front

- Defensibility: Default severities are opinion. Anchor them to something citable (EU AI Act risk tiers, NIST AI RMF, OWASP LLM Top 10) so you aren't the one asserting them.
- Don't replace the score. Keep 0-100 as the headline and add risk as a second axis. That avoids breaking the existing story.
- Beta prospects: This probably lands best with the regulated ones in the pipeline (financial services, airlines, healthcare). It could be a strong demo slide before it's a shipped feature.

Suggested path

1. Build the harm-category and severity mapping for the 41 evals as a table (docs only, no engineering).
2. Mock the risk breakdown view in the deck to test it with a couple of prospects.
3. If it resonates, scope the engineering: tags in the eval schema, weights config, severity-gated verdict.
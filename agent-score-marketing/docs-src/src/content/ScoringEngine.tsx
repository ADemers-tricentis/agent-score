import { Callout, Dek, Eyebrow, Screenshot } from "../components/PageChrome";
import modelConnectionSettings from "../assets/model-connection-settings.png";
import agentCostRateSettings from "../assets/agent-cost-rate-settings.png";
import usageAndCostPage from "../assets/usage-and-cost-page.png";

export default function ScoringEngine() {
  return (
    <>
      <Eyebrow>Evaluations</Eyebrow>
      <h1>Scoring engine settings</h1>
      <Dek>
        Behind every eval is a scoring engine with its own dials - how strict it is, which LLM does
        the judging, and where the tokens it spends go. Here's what's yours to configure today, and
        what Agent Score still manages on your behalf.
      </Dek>

      <h2>Pass threshold</h2>
      <p>
        Each eval, dimension, and profile has a configurable pass threshold - the line between
        "good enough" and "needs attention." You set these on the <strong>Profile</strong> tab for
        each agent, right alongside its dimension weights - not a separate settings screen.
        Thresholds are what drive the ship / review / don't-ship recommendation on the scorecard,
        and what a CI/CD pipeline checks before it lets a merge through.
      </p>

      <h2>Choosing a judge model</h2>
      <p>
        G-Eval and Hybrid evals need an LLM to do the judging. Agent Score supports most common
        providers - Anthropic Claude, OpenAI, Azure OpenAI, and Amazon Bedrock - and picks one on
        your behalf by default. Need a specific provider, model, or region instead? It's a
        self-serve setting on that agent's own <strong>Settings</strong> tab, under{" "}
        <strong>Model connection</strong>: pick the provider, name the model, and, for Bedrock,
        the AWS region. You can supply replacement credentials there too, or leave it on
        environment credentials - either way, stored credentials are never shown back to you.{" "}
        <strong>Test connection</strong> before <strong>Save settings</strong> to confirm it before
        it's used for real scoring.
      </p>
      <Screenshot
        src={modelConnectionSettings}
        alt="The Model connection section of an agent's Settings tab, showing a Provider dropdown set to bedrock, Model and AWS region fields, an environment-credentials toggle, replacement credential fields, and Test connection / Save settings buttons"
        caption="An agent's Settings tab - choose the judge model provider, model, and region yourself, per agent."
      />
      <p>
        Every score is still stamped with which judge model produced it. That matters more than it
        sounds - LLM judges drift over time, and the same prompt on a newer model can score
        differently. Recording the judge model alongside the score is what makes a delta between
        two runs trustworthy rather than an artifact of a silent model upgrade.
      </p>

      <h2>Usage &amp; cost</h2>
      <p>
        Every agent's <strong>Usage &amp; cost</strong> page shows what it used and what Agent Score
        spent evaluating it, over a window you choose (up to 90 days): traces, tokens in/out,
        usage cost, eval results, scoring runs, profile fits, and eval cost in AI credits. Export
        the whole table to Excel when you need it outside the app.
      </p>
      <Screenshot
        src={usageAndCostPage}
        alt="The Usage & cost page, showing a Past 30 days window and a table of agents with traces, tokens in/out, usage cost, eval results, scoring runs, profile fits, and eval cost in credits, plus an Export to Excel button"
        caption="Usage & cost - what each agent used, and what Agent Score spent evaluating it."
      />

      <h3>Setting your rate</h3>
      <p>
        Token counts only become a dollar figure once you tell Agent Score your rate. On the same
        agent Settings tab as Model connection, the <strong>Cost</strong> section takes an input
        and an output rate (dollars per 1M tokens). Changing a rate restates every run already in
        the window, so the usage cost you see always reflects your current rate, not whatever rate
        was in effect when a given trace arrived.
      </p>
      <Screenshot
        src={agentCostRateSettings}
        alt="The Cost section of an agent's Settings tab, with Input rate and Output rate fields in dollars per 1M tokens and a Save rates button"
        caption="Set your input/output token rate here - it's what turns usage into a cost on the Usage & cost page."
      />

      <Callout kind="tip" title="A judge model change never breaks history">
        <p>
          Whether it's Agent Score or a future self-serve setting that makes the switch, every past
          score carries its own judge-model record - so comparing an old run to a new one never
          confuses a genuine quality change with a change in who's doing the judging.
        </p>
      </Callout>
    </>
  );
}

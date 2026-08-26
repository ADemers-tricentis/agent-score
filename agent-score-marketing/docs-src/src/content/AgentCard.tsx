import { Callout, Dek, Eyebrow, Screenshot } from "../components/PageChrome";
import { AgentCardMock } from "../components/diagrams/AgentCardMock";
import agentCardCustomer from "../assets/agent-card-customer.png";

export default function AgentCard() {
  return (
    <>
      <Eyebrow>The Scoring Journey</Eyebrow>
      <h1>Meet your Agent Card</h1>
      <Dek>
        Before Agent Score can grade your agent, it has to understand it. The Agent Card is where
        that understanding becomes visible - and it's built automatically, from evidence.
      </Dek>

      <h2>How the profile gets chosen</h2>
      <p>
        Once enough traces have arrived, the scoring agent looks at your agent's inputs, outputs,
        and tool use, and automatically selects the{" "}
        <a href="#/dimensions-and-profiles">profile</a> that fits best - RAG, Tool-Orchestrator,
        Conversational, and so on. You don't pick a profile off a menu before you know anything
        about your agent; Agent Score picks the one your agent's actual behavior earns.
      </p>
      <p>
        The chosen profile is shown with a full breakdown: which dimensions it's made of, and the
        weight each one carries, calibrated for the behavior observed.
      </p>

      <h2>Then the Agent Card</h2>
      <p>
        The Agent Card is a plain-language summary of what Agent Score has learned about your
        agent - its purpose, its behavioral patterns, what success looks like, and its common
        failure modes. Every tool your agent used is listed too, along with how often it was
        called and how often that call succeeded.
      </p>

      <AgentCardMock />

      <h3>What it looks like in the product</h3>
      <p>
        The simplified view above strips out the operational detail. A real Agent Card carries
        more - the full observed-tools breakdown with call counts and success rates, and a clear
        label on anything the judge model inferred rather than measured directly:
      </p>
      <Screenshot
        src={agentCardCustomer}
        alt="A real Agent Card for testcase.generate, showing a purpose labeled as synthesized by the judge model, behavioral patterns, success criteria, failure modes, and an observed tools table with call counts and success rates"
        caption='An actual Agent Card from the Agent Score app. Purpose is labeled "Synthesized by the judge model - a draft, not a verified declaration," and tool descriptions are marked inferred.'
      />

      <Callout kind="note" title="Nothing here is hand-entered">
        <p>
          Everything on the Agent Card is inferred from traces your agent already produced. As
          more traces arrive, the card - and the profile choice behind it - gets sharper.
        </p>
      </Callout>

      <p>
        With a profile chosen and an Agent Card generated, the actual score comes next - see{" "}
        <a href="#/scorecard">reading your scorecard</a>.
      </p>
    </>
  );
}

import { Callout, Dek, Eyebrow, Screenshot } from "../components/PageChrome";
import { DimensionHierarchyDiagram } from "../components/diagrams/DimensionHierarchy";
import profileTab from "../assets/profile-tab.png";

export default function DimensionsAndProfiles() {
  return (
    <>
      <Eyebrow>Evaluations</Eyebrow>
      <h1>Dimensions &amp; profiles</h1>
      <Dek>
        A single eval answers one narrow question. To describe how good an agent actually is, you
        need several of them working together - that's what dimensions and profiles are for.
      </Dek>

      <h2>Dimensions are categories of evaluation</h2>
      <p>
        A <strong>dimension</strong> groups related evals into one category your agent is measured
        on - things like Safety, Tool Use, or Response Quality. Agent Score ships with 11:
      </p>
      <ul>
        <li>Correctness</li>
        <li>Groundedness</li>
        <li>Relevance</li>
        <li>Retrieval (RAG)</li>
        <li>Agentic / Tool-use</li>
        <li>Conversational</li>
        <li>Quality / Efficiency</li>
        <li>Safety</li>
        <li>Reliability</li>
        <li>Attribution</li>
        <li>Custom</li>
      </ul>

      <h2>A profile is the full recipe</h2>
      <p>
        A <strong>profile</strong> is a curated bundle - the right evals, dimensions, weights, and
        pass thresholds - tuned for a kind of agent. Agent Score ships seven: RAG, Computer-Use,
        Conversational, Tool-Orchestrator, Code, Structured-Generation, and EvalClaw (Tricentis's
        own automatic evaluation suite).
      </p>
      <p>
        Every profile shows a complete, transparent breakdown of how its score is calculated - no
        black box. Adopt one and you're measuring like an expert immediately.
      </p>

      <DimensionHierarchyDiagram />

      <h2>You don't have to pick one</h2>
      <p>
        Once enough traces have been ingested, Agent Score's scoring agent evaluates your agent's
        inputs, outputs, and tool use, and <strong>automatically chooses the best-fit profile</strong>{" "}
        for you. See how that decision gets made on{" "}
        <a href="#/agent-card">the Agent Card page</a>.
      </p>

      <Screenshot
        src={profileTab}
        alt="The Profile tab for an agent, showing why the RAG Starter profile was chosen (fit score 0.82), the full verdict band table from Ship down to Block, and the dimensions and their weights"
        caption="An agent's Profile tab - why this profile was chosen, the verdict bands for it, and the weighted dimensions behind the score."
      />

      <Callout kind="tip" title="Need something the catalog doesn't cover?">
        <p>
          The <strong>Dimension Builder</strong> lets you author an entirely new dimension when
          your domain needs an axis Agent Score didn't ship with. The <strong>Profile Builder</strong>{" "}
          lets you compose your own recipe of evals, weights, and thresholds - versioned
          immutably, so a result can never silently drift.
        </p>
      </Callout>
    </>
  );
}

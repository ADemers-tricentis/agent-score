import { Dek, Eyebrow, Screenshot } from "../components/PageChrome";
import { DimensionHierarchyDiagram } from "../components/diagrams/DimensionHierarchy";
import profileTab from "../assets/profile-tab-task-agent.png";

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
        <li><strong>Correctness</strong> - getting the right answer</li>
        <li><strong>Groundedness</strong> - grounded in context</li>
        <li><strong>Relevance</strong> - staying on-topic</li>
        <li><strong>Retrieval (RAG)</strong> - finding the right context</li>
        <li><strong>Agentic / Tool-use</strong> - smart decisions</li>
        <li><strong>Conversational</strong> - holding a natural conversation</li>
        <li><strong>Quality / Efficiency</strong> - cost &amp; speed</li>
        <li><strong>Safety</strong> - avoiding harmful output</li>
        <li><strong>Reliability</strong> - consistent across runs</li>
        <li><strong>Attribution</strong> - citing its sources</li>
        <li><strong>Custom</strong> - whatever you define</li>
      </ul>

      <h2>A profile is the full recipe</h2>
      <p>
        A <strong>profile</strong> is a curated bundle - the right evals, dimensions, weights, and
        pass thresholds - tuned for a kind of agent. Agent Score ships seven: Grounded Answerer,
        Summarizer, Tool Caller, Task Agent, Conversational Assistant, Policy Guardrail, and
        General Answerer (for plain question-and-answer agents with no tools, retrieved context, or
        stated scope). You'll also see an eighth entry, <strong>Default</strong>, in profile
        lists - that's a placeholder, not a real profile: it carries no evals, and no scoring run
        is created against it.
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
      <p>
        Brand-new agents sit on the <strong>Default</strong> placeholder while they're still{" "}
        <strong>Learning your agent</strong> - the Profile tab shows how many of the 20 traces
        needed have arrived. Once the 20th lands, a real profile is chosen automatically; nothing
        is needed from you. That first pick is revisited as more evidence comes in, and the
        Profile tab's <strong>Fit history</strong> records each decision and why.
      </p>

      <Screenshot
        src={profileTab}
        alt="The Profile tab for an agent, showing an Evals for this agent section with its bound Task Agent profile and Create an eval / Create a profile buttons, why the Task Agent profile was chosen, the verdict band table from Ship down to Block, and the dimensions, evals, thresholds, and weights"
        caption="An agent's Profile tab - the bound profile, why it was chosen, the verdict bands for it, and the weighted dimensions behind the score."
      />

      <p>
        That automatic pick isn't final. From the same Profile tab, you can{" "}
        <strong>change profile</strong> to any other live profile version yourself, or{" "}
        <strong>re-evaluate fit</strong> to have Agent Score reconsider its pick against the
        agent's latest evidence. And if no built-in profile measures what matters for this agent,{" "}
        <strong>Create an eval for this agent</strong> and{" "}
        <strong>Create a profile for this agent</strong> at the top of the tab start one of{" "}
        <a href="#/custom-evals">your own</a>.
      </p>
    </>
  );
}

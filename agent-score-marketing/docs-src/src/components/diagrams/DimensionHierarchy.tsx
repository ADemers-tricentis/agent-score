import { DiagramFrame } from "../PageChrome";

export function DimensionHierarchyDiagram() {
  return (
    <DiagramFrame caption="Evals roll up into dimensions. Dimensions roll up into a profile. A profile produces the score.">
      <div className="hierarchy-level">
        <span className="hierarchy-chip">Faithfulness</span>
        <span className="hierarchy-chip">Tool Correctness</span>
        <span className="hierarchy-chip">Toxicity</span>
        <span className="hierarchy-chip">Answer Correctness</span>
        <span className="hierarchy-chip">Plan Adherence</span>
        <span className="hierarchy-chip">PII Leakage</span>
      </div>
      <div className="hierarchy-connector">↓ roll up into ↓</div>
      <div className="hierarchy-level">
        <span className="hierarchy-chip strong">Groundedness</span>
        <span className="hierarchy-chip strong">Agentic / Tool-use</span>
        <span className="hierarchy-chip strong">Safety</span>
        <span className="hierarchy-chip strong">Correctness</span>
      </div>
      <div className="hierarchy-connector">↓ weighted together into ↓</div>
      <div className="hierarchy-level">
        <div className="flow-node accent">
          <div className="flow-node-label">Profile</div>
          <div className="flow-node-title">e.g. RAG, Tool-Orchestrator, Conversational</div>
          <div className="flow-node-sub">A named recipe of dimensions, weights, and thresholds</div>
        </div>
      </div>
      <div className="hierarchy-connector">↓</div>
      <div className="hierarchy-level">
        <div className="flow-node success">
          <div className="flow-node-label">Result</div>
          <div className="flow-node-title">Composite score + verdict</div>
        </div>
      </div>
    </DiagramFrame>
  );
}

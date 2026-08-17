import { DiagramFrame } from "../PageChrome";

export function EvalBuilderFlowDiagram() {
  return (
    <DiagramFrame caption='Example: "Make sure our generated tests cover 100% of requirements."'>
      <div className="flow-row" style={{ justifyContent: "space-between" }}>
        <div className="flow-node">
          <div className="flow-node-label">1. Describe</div>
          <div className="flow-node-title">Plain language</div>
          <div className="flow-node-sub">You type what you want to measure</div>
        </div>
        <div className="flow-arrow">→</div>
        <div className="flow-node accent">
          <div className="flow-node-label">2. Recommend</div>
          <div className="flow-node-title">Agent Score proposes</div>
          <div className="flow-node-sub">Suggests the best eval type and criteria</div>
        </div>
        <div className="flow-arrow">→</div>
        <div className="flow-node">
          <div className="flow-node-label">3. Refine</div>
          <div className="flow-node-title">You adjust</div>
          <div className="flow-node-sub">Push back, tweak wording, tighten criteria</div>
        </div>
        <div className="flow-arrow">→</div>
        <div className="flow-node success">
          <div className="flow-node-label">4. Publish</div>
          <div className="flow-node-title">Live in the catalog</div>
          <div className="flow-node-sub">Ready to bind to a dimension</div>
        </div>
      </div>
    </DiagramFrame>
  );
}

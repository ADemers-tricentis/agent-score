import { DiagramFrame } from "../PageChrome";

export function IngestionFlowDiagram() {
  return (
    <DiagramFrame caption="Two ways in - one place they end up.">
      <div className="flow-col">
        <div className="flow-row" style={{ justifyContent: "space-between" }}>
          <div className="flow-node">
            <div className="flow-node-label">Internal agents</div>
            <div className="flow-node-title">Tricentis-built agents</div>
            <div className="flow-node-sub">Ingested automatically - nothing to configure</div>
          </div>
          <div className="flow-arrow">→</div>
          <div className="flow-node accent" style={{ flex: 1 }}>
            <div className="flow-node-label">Ingestion service</div>
            <div className="flow-node-title">Agent Score</div>
            <div className="flow-node-sub">Recognizes, names, and files every trace</div>
          </div>
          <div className="flow-arrow">←</div>
          <div className="flow-node">
            <div className="flow-node-label">External agents</div>
            <div className="flow-node-title">OpenTelemetry export</div>
            <div className="flow-node-sub">Two lines added to your existing exporter</div>
          </div>
        </div>
        <div className="flow-arrow-down" style={{ textAlign: "center" }}>↓</div>
        <div className="flow-row" style={{ justifyContent: "center" }}>
          <div className="flow-node success">
            <div className="flow-node-label">Result</div>
            <div className="flow-node-title">Agent named &amp; categorized</div>
            <div className="flow-node-sub">Scoring begins automatically at 20 traces</div>
          </div>
        </div>
      </div>
    </DiagramFrame>
  );
}

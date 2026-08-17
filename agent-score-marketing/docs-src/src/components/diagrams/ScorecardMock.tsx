import { Badge, DiagramFrame } from "../PageChrome";

function DimBar({
  name,
  value,
  tone = "good",
}: {
  name: string;
  value: number;
  tone?: "good" | "warn" | "default";
}) {
  const fillClass = tone === "good" ? "good" : tone === "warn" ? "warn" : "";
  return (
    <div className="dim-bar-row">
      <div className="dim-bar-label">
        <span className="name">{name}</span>
        <span className="val">{value}</span>
      </div>
      <div className="dim-bar-track">
        <div className={`dim-bar-fill ${fillClass}`} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

export function ScorecardMock() {
  return (
    <DiagramFrame caption="Every number here links back to the eval and the trace evidence that produced it.">
      <div className="mock-panel">
        <div className="mock-score-row">
          <div className="mock-score-number">87</div>
          <div>
            <div className="mock-score-grade">Grade B+</div>
            <Badge kind="ship">Ship</Badge>
          </div>
        </div>
        <DimBar name="Correctness" value={91} tone="good" />
        <DimBar name="Agentic / Tool-use" value={88} tone="good" />
        <DimBar name="Groundedness" value={82} tone="good" />
        <DimBar name="Safety" value={95} tone="good" />
        <DimBar name="Efficiency" value={68} tone="warn" />
      </div>
    </DiagramFrame>
  );
}

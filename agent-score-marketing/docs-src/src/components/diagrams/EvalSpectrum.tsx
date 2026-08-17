import { DiagramFrame } from "../PageChrome";

export function EvalSpectrumDiagram() {
  return (
    <DiagramFrame caption="Every eval in the catalog sits somewhere on this line.">
      <div className="spectrum-track" />
      <div className="spectrum-points">
        <div className="spectrum-point">
          <div className="spectrum-point-dot" />
          <div className="spectrum-point-title">Library</div>
          <div className="spectrum-point-desc">
            Deterministic checks. Did the output match this pattern? Is it valid JSON? Fast, precise, consistent.
          </div>
        </div>
        <div className="spectrum-point">
          <div className="spectrum-point-dot" />
          <div className="spectrum-point-title">Hybrid</div>
          <div className="spectrum-point-desc">
            Deterministic checks for the parts with a clear right answer, LLM judgment for the parts that need nuance.
          </div>
        </div>
        <div className="spectrum-point">
          <div className="spectrum-point-dot" />
          <div className="spectrum-point-title">G-Eval</div>
          <div className="spectrum-point-desc">
            An LLM reads the output the way a person would and judges it against plain-English criteria.
          </div>
        </div>
      </div>
    </DiagramFrame>
  );
}

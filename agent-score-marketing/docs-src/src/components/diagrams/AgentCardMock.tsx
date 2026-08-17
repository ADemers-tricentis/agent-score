import { DiagramFrame } from "../PageChrome";

export function AgentCardMock() {
  return (
    <DiagramFrame caption="A real Agent Card, generated automatically from observed traces - nothing here was typed in by hand.">
      <div className="mock-panel">
        <div className="mock-panel-title">Observed purpose</div>
        <p style={{ margin: 0, color: "var(--text-primary)", fontSize: "0.92rem" }}>
          Takes user requirements and creates comprehensive test cases.
        </p>
      </div>
      <div className="mock-panel">
        <div className="mock-panel-title">Behavior &amp; tools</div>
        <div className="mock-kv">
          <span className="mock-kv-key">requirement_parser</span>
          <span className="mock-kv-val">142 calls · 98% success</span>
        </div>
        <div className="mock-kv">
          <span className="mock-kv-key">test_case_generator</span>
          <span className="mock-kv-val">140 calls · 95% success</span>
        </div>
        <div className="mock-kv">
          <span className="mock-kv-key">coverage_checker</span>
          <span className="mock-kv-val">89 calls · 91% success</span>
        </div>
      </div>
      <div className="mock-panel">
        <div className="mock-panel-title">Success criteria &amp; failure modes</div>
        <div className="mock-kv">
          <span className="mock-kv-key">Success looks like</span>
          <span className="mock-kv-val">Traceable test per requirement</span>
        </div>
        <div className="mock-kv">
          <span className="mock-kv-key">Common failure</span>
          <span className="mock-kv-val">Missed edge-case requirements</span>
        </div>
        <div className="mock-kv">
          <span className="mock-kv-key">Recommended profile</span>
          <span className="mock-kv-val">Tool-Orchestrator</span>
        </div>
      </div>
    </DiagramFrame>
  );
}

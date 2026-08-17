import { DiagramFrame } from "../PageChrome";

const points = [
  { x: 40, y: 130, label: "Run 1", sub: "20 traces · 54" },
  { x: 260, y: 60, label: "Run 2", sub: "50 traces · 87" },
];

export function ScoringOverTimeChart() {
  const path = `M ${points[0].x} ${points[0].y} L ${points[1].x} ${points[1].y}`;
  return (
    <DiagramFrame caption="Same agent, two runs. More traces sharpened the score from 54 to 87.">
      <div className="chart-frame">
        <div className="chart-gridline" style={{ top: 10 }}>
          <span>100</span>
        </div>
        <div className="chart-gridline" style={{ top: 90 }}>
          <span>50</span>
        </div>
        <div className="chart-gridline" style={{ top: 170 }}>
          <span>0</span>
        </div>
        <svg viewBox="0 0 320 180" width="100%" height="170" style={{ overflow: "visible" }}>
          <path d={path} stroke="var(--primary)" strokeWidth="2.5" fill="none" />
          {points.map((p) => (
            <g key={p.label}>
              <circle cx={p.x} cy={p.y} r={5} fill="var(--primary-light)" />
              <text x={p.x} y={p.y - 14} fill="var(--text-primary)" fontSize="12" fontWeight={700} textAnchor="middle">
                {p.label}
              </text>
              <text x={p.x} y={p.y + 26} fill="var(--text-muted)" fontSize="11" textAnchor="middle">
                {p.sub}
              </text>
            </g>
          ))}
        </svg>
      </div>
    </DiagramFrame>
  );
}

import { brand } from "../theme/theme";

// Static adaptation of agent-score-video/src/components/Wordmark.tsx -
// same "score gauge" glyph concept, no animation since the deck is a
// static live-navigable / print artifact.
export const Wordmark: React.FC<{
  fontSize?: number;
  showMark?: boolean;
  color?: string;
  accent?: string;
}> = ({ fontSize = 40, showMark = true, color = brand.navyDeep, accent = brand.orange }) => {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: fontSize * 0.32 }}>
      {showMark && (
        <svg width={fontSize * 1.15} height={fontSize * 1.15} viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="40" fill="none" stroke={brand.navyMid} strokeWidth="10" opacity={0.28} />
          <circle
            cx="50"
            cy="50"
            r="40"
            fill="none"
            stroke={accent}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={`${2 * Math.PI * 40 * 0.78} ${2 * Math.PI * 40}`}
            transform="rotate(-90 50 50)"
          />
          <circle cx="50" cy="50" r="18" fill={accent} />
        </svg>
      )}
      <div style={{ fontSize, fontWeight: 800, color, letterSpacing: -1, lineHeight: 1 }}>
        Agent<span style={{ color: accent }}>Score</span>
      </div>
    </div>
  );
};

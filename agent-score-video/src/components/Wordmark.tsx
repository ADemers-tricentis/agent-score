import { brand } from "../theme";

// Type-set AgentScore wordmark with a small "score gauge" glyph.
export const Wordmark: React.FC<{
  fontFamily: string;
  fontSize?: number;
  showMark?: boolean;
  color?: string;
  accent?: string;
}> = ({
  fontFamily,
  fontSize = 64,
  showMark = true,
  color = brand.white,
  accent = brand.orange,
}) => {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: fontSize * 0.32,
        fontFamily,
      }}
    >
      {showMark && (
        <svg
          width={fontSize * 1.15}
          height={fontSize * 1.15}
          viewBox="0 0 100 100"
        >
          <circle
            cx="50"
            cy="50"
            r="40"
            fill="none"
            stroke={brand.navyMid}
            strokeWidth="10"
            opacity={0.35}
          />
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
      <div
        style={{
          fontSize,
          fontWeight: 800,
          color,
          letterSpacing: -1,
          lineHeight: 1,
        }}
      >
        Agent<span style={{ color: accent }}>Score</span>
      </div>
    </div>
  );
};

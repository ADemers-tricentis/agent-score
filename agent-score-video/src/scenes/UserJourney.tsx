import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { brand } from "../theme";
import { fontFamily } from "../font";

// Real UI click-path through agent-score (the main product prototype) —
// NOT one of the deck's official flow diagrams (Slide 6's Profile
// Assignment/Eval Selection/Scoring loop, or Slide 11's Connect/Gate/Track,
// which is already the Flow scene). This is "how a user actually clicks
// through it," a distinct, complementary artifact — kept in lockstep with
// the narrated version in docs/AgentScore-Demo-Outline.md.
type Phase = "onboard" | "collect" | "score" | "review";

const PHASE_COLOR: Record<Phase, string> = {
  onboard: brand.primary,
  collect: brand.teal,
  score: brand.orange,
  review: "#2fbf78",
};

const PHASE_LABEL: Record<Phase, string> = {
  onboard: "ONBOARD",
  collect: "COLLECT & CONFIGURE",
  score: "SCORE",
  review: "REVIEW & DECIDE",
};

interface Step {
  n: number;
  row: 1 | 2;
  col: 0 | 1 | 2 | 3 | 4;
  phase: Phase;
  label: string;
  tagline: string;
  bullets: string[];
}

const STEPS: Step[] = [
  {
    n: 1, row: 1, col: 0, phase: "onboard", label: "Fleet",
    tagline: "Every agent, one status board.",
    bullets: ["A–F grade + 0–100 composite", "Verdict & reliability (pass^k)", "Not a config screen"],
  },
  {
    n: 2, row: 1, col: 1, phase: "onboard", label: "Setup",
    tagline: "Copy-paste, not a build.",
    bullets: ["One tenant API key, not per-agent", "OTLP endpoint + auth header shown inline", "Or: paste an install instruction for your coding agent"],
  },
  {
    n: 3, row: 1, col: 2, phase: "onboard", label: "Waiting for traces",
    tagline: "Nobody names it yet.",
    bullets: ["Received → parked → recognized from behavior → ready", "Known agents matched automatically", "Brand-new ones created on the spot"],
  },
  {
    n: 4, row: 1, col: 3, phase: "onboard", label: "Name your agent",
    tagline: "Confirm, don't invent.",
    bullets: ["Name & type pre-filled from detection", "One field to edit, not create from scratch"],
  },
  {
    n: 5, row: 1, col: 4, phase: "onboard", label: "Launch",
    tagline: "One click, five steps behind it.",
    bullets: ["Registers agent → connects OTel → provisions profile", "Opens Run #1 — already collecting"],
  },
  {
    n: 6, row: 2, col: 0, phase: "collect", label: "Project overview",
    tagline: "Nothing scored on thin data.",
    bullets: ["Run #1 sits open, in progress", "Needs enough traces before scoring unlocks", "“Simulate traces” — demo helper only"],
  },
  {
    n: 7, row: 2, col: 1, phase: "collect", label: "Scoring tab",
    tagline: "Configure the bar, in plain language.",
    bullets: ["Describe agent: Guided fields or Expert spec", "Compare runs once a 2nd run exists", "Auto-scores daily · next 02:00 UTC"],
  },
  {
    n: 8, row: 2, col: 2, phase: "score", label: "Score now",
    tagline: "On demand, or on schedule — not either/or.",
    bullets: ["Disabled until enough traces are in", "Parallel LLM judges score each eval", "A real scoring pass, not a placeholder"],
  },
  {
    n: 9, row: 2, col: 3, phase: "review", label: "Run view",
    tagline: "The audit trail.",
    bullets: ["Every session's composite score, listed", "Export as calibration case", "Compare with the prior run"],
  },
  {
    n: 10, row: 2, col: 4, phase: "review", label: "Session view",
    tagline: "The why, not just the what.",
    bullets: ["3–6 dimension bars (agent-type dependent)", "Attribution: root cause + evidence + confidence", "Ship / Hold / Reject + Markdown/JSON export"],
  },
];

const CARD_W = 320;
const CARD_H = 320;
const GAP = 30;
const MARGIN_X = 180;
const ROW1_TOP = 210;
const ROW2_TOP = 610;

function colX(col: number) {
  return MARGIN_X + col * (CARD_W + GAP);
}

function StepCard({ s, opacity }: { s: Step; opacity: number }) {
  return (
    <div
      style={{
        position: "absolute",
        left: colX(s.col),
        top: s.row === 1 ? ROW1_TOP : ROW2_TOP,
        width: CARD_W,
        height: CARD_H,
        borderRadius: 16,
        border: `2.5px solid ${PHASE_COLOR[s.phase]}`,
        backgroundColor: "rgba(255,255,255,0.045)",
        opacity,
        transform: `translateY(${interpolate(opacity, [0, 1], [40, 0])}px)`,
        padding: 22,
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        gap: 8,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div
          style={{
            width: 38, height: 38, borderRadius: "50%", backgroundColor: PHASE_COLOR[s.phase],
            color: brand.white, fontSize: 17, fontWeight: 800, display: "flex",
            alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}
        >
          {s.n}
        </div>
        <div style={{ fontSize: 21, fontWeight: 700, color: brand.white }}>{s.label}</div>
      </div>
      <div style={{ fontSize: 14, color: brand.tealLight, fontStyle: "italic" }}>{s.tagline}</div>
      <div style={{ borderTop: `1px solid ${brand.navyMid}`, margin: "2px 0 4px" }} />
      <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
        {s.bullets.map((b, i) => (
          <div key={i} style={{ display: "flex", gap: 7, fontSize: 13.5, color: "#c3cee0", lineHeight: 1.4 }}>
            <span style={{ flexShrink: 0, color: PHASE_COLOR[s.phase] }}>•</span>
            <span>{b}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export const UserJourney: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const row1In = spring({ frame, fps, config: { damping: 200 }, durationInFrames: 24 });
  const row2In = spring({ frame: frame - 18, fps, config: { damping: 200 }, durationInFrames: 24 });
  const tailIn = spring({ frame: frame - 40, fps, config: { damping: 200 }, durationInFrames: 22 });

  return (
    <AbsoluteFill style={{ backgroundColor: brand.navyDeep, fontFamily }}>
      {/* Header */}
      <div style={{ position: "absolute", left: 100, top: 60, display: "flex", alignItems: "center", gap: 14 }}>
        <span style={{ fontSize: 38, fontWeight: 800, color: brand.white, letterSpacing: -0.5 }}>AgentScore</span>
        <span
          style={{
            fontSize: 15, fontWeight: 700, color: brand.orange, border: `2px solid ${brand.orange}`,
            borderRadius: 6, padding: "2px 10px", letterSpacing: 1,
          }}
        >
          BETA
        </span>
      </div>
      <div style={{ position: "absolute", left: 100, top: 110, fontSize: 20, color: brand.tealLight }}>
        Product journey — onboarding to first scored run
      </div>
      <div style={{ position: "absolute", left: 100, top: 150, right: 100, borderTop: `1px solid ${brand.navyMid}` }} />
      <div style={{ position: "absolute", right: 100, top: 66, fontSize: 14, color: "#7f93b8" }}>
        Real UI click-path (agent-score) — not a deck diagram
      </div>

      {/* Row 1 — Onboard */}
      <div
        style={{
          position: "absolute", left: MARGIN_X, top: ROW1_TOP - 34,
          fontSize: 17, fontWeight: 700, letterSpacing: 2, color: PHASE_COLOR.onboard,
          opacity: row1In,
        }}
      >
        {PHASE_LABEL.onboard}
      </div>

      {STEPS.filter((s) => s.row === 1).map((s, i) => {
        const stepIn = spring({ frame: frame - i * 6, fps, config: { damping: 200 }, durationInFrames: 20 });
        return <StepCard key={s.n} s={s} opacity={Math.min(row1In, stepIn)} />;
      })}

      {/* Row 1 connectors */}
      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: colX(i) + CARD_W,
            top: ROW1_TOP + CARD_H / 2 - 2,
            width: GAP,
            height: 4,
            backgroundColor: brand.navyMid,
            opacity: row1In,
          }}
        >
          <div style={{ width: `${row1In * 100}%`, height: "100%", backgroundColor: brand.orange }} />
        </div>
      ))}

      {/* Row 2 phase labels */}
      <div style={{ position: "absolute", left: colX(0), top: ROW2_TOP - 34, fontSize: 17, fontWeight: 700, letterSpacing: 2, color: PHASE_COLOR.collect, opacity: row2In }}>
        {PHASE_LABEL.collect}
      </div>
      <div style={{ position: "absolute", left: colX(2), top: ROW2_TOP - 34, fontSize: 17, fontWeight: 700, letterSpacing: 2, color: PHASE_COLOR.score, opacity: row2In }}>
        {PHASE_LABEL.score}
      </div>
      <div style={{ position: "absolute", left: colX(3), top: ROW2_TOP - 34, fontSize: 17, fontWeight: 700, letterSpacing: 2, color: PHASE_COLOR.review, opacity: row2In }}>
        {PHASE_LABEL.review}
      </div>

      {STEPS.filter((s) => s.row === 2).map((s, i) => {
        const stepIn = spring({ frame: frame - 18 - i * 6, fps, config: { damping: 200 }, durationInFrames: 20 });
        return <StepCard key={s.n} s={s} opacity={Math.min(row2In, stepIn)} />;
      })}

      {/* Row 2 connectors */}
      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: colX(i) + CARD_W,
            top: ROW2_TOP + CARD_H / 2 - 2,
            width: GAP,
            height: 4,
            backgroundColor: brand.navyMid,
            opacity: row2In,
          }}
        >
          <div style={{ width: `${row2In * 100}%`, height: "100%", backgroundColor: brand.orange }} />
        </div>
      ))}

      {/* Row1 -> Row2 connector */}
      <div
        style={{
          position: "absolute",
          left: colX(0) + CARD_W / 2 - 14,
          top: ROW1_TOP + CARD_H + 8,
          fontSize: 24,
          color: brand.navyMid,
          opacity: row2In,
        }}
      >
        ↓
      </div>

      {/* Outcome chips under Session view */}
      <div style={{ position: "absolute", left: colX(4), top: ROW2_TOP + CARD_H + 18, width: CARD_W, textAlign: "center", fontSize: 14, color: "#7f93b8", opacity: tailIn }}>
        the decision this feeds
      </div>
      <div style={{ position: "absolute", left: colX(4), top: ROW2_TOP + CARD_H + 48, width: CARD_W, display: "flex", justifyContent: "center", gap: 10, opacity: tailIn }}>
        <span style={{ padding: "7px 16px", borderRadius: 20, fontSize: 14, fontWeight: 700, color: "#0f6b3f", backgroundColor: "#bff4d8" }}>Ship</span>
        <span style={{ padding: "7px 16px", borderRadius: 20, fontSize: 14, fontWeight: 700, color: "#a34400", backgroundColor: "#ffe1bf" }}>Hold</span>
        <span style={{ padding: "7px 16px", borderRadius: 20, fontSize: 14, fontWeight: 700, color: "#96271a", backgroundColor: "#ffd0cb" }}>Reject</span>
      </div>

      {/* Loop-back note */}
      <div
        style={{
          position: "absolute", left: colX(1), top: ROW2_TOP + CARD_H + 58, width: colX(4) - colX(1),
          textAlign: "center", fontSize: 14, color: "#7f93b8", opacity: tailIn, borderTop: "2px dashed #4a5a78", paddingTop: 12,
        }}
      >
        ← next scoring cycle — daily, or triggered on demand
      </div>

      {/* Footer legend */}
      <div style={{ position: "absolute", left: 100, bottom: 34, display: "flex", gap: 30, alignItems: "center", opacity: tailIn }}>
        {(["onboard", "collect", "score", "review"] as Phase[]).map((p) => (
          <div key={p} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 13, height: 13, borderRadius: 3, backgroundColor: PHASE_COLOR[p] }} />
            <span style={{ fontSize: 13, color: "#c3cee0" }}>{PHASE_LABEL[p]}</span>
          </div>
        ))}
      </div>
      <div style={{ position: "absolute", right: 100, bottom: 34, fontSize: 13, color: "#7f93b8", opacity: tailIn }}>
        AgentScore · Tricentis · prototype (agent-score, mock data)
      </div>
    </AbsoluteFill>
  );
};

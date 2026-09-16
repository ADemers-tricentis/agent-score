import type { Project, Session, VerdictBandKey, SafetyOverride, RunState } from "../types";
import { getAdoptedProfile, sessionCompositeScore, projectCompositeScore, sessionGrade } from "./mock";

export type { RunState };

export const TRACES_NEEDED = 20;

export const DEFAULT_VERDICT_BANDS: Record<VerdictBandKey, number> = {
  ship: 85,
  review: 55,
  block: 40,
};

export const SHIP_ICON = "M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z";
export const REVIEW_ICON = "M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z";
export const BLOCK_ICON =
  "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zM4 12c0-4.42 3.58-8 8-8 1.85 0 3.55.63 4.9 1.69L5.69 16.9C4.63 15.55 4 13.85 4 12zm8 8c-1.85 0-3.55-.63-4.9-1.69L18.31 7.1C19.37 8.45 20 10.15 20 12c0 4.42-3.58 8-8 8z";

export const VERDICT_BAND_META: Record<
  VerdictBandKey,
  { label: string; muiColor: "success" | "warning" | "error"; token: string; hex: string; iconPath: string }
> = {
  ship: { label: "Ship", muiColor: "success", token: "success.main", hex: "#4ade80", iconPath: SHIP_ICON },
  review: { label: "Review", muiColor: "warning", token: "warning.main", hex: "#fbbf24", iconPath: REVIEW_ICON },
  block: { label: "Block", muiColor: "error", token: "error.main", hex: "#f87171", iconPath: BLOCK_ICON },
};

export const RUN_STATE_META: Record<RunState, { label: string; muiColor: "info" | "warning" | "success" | "error" }> = {
  collecting: { label: "Collecting traces", muiColor: "info" },
  scoring: { label: "Scoring", muiColor: "warning" },
  scored: { label: "Scored", muiColor: "success" },
  error: { label: "Run failed", muiColor: "error" },
};

export function scoreColor(score: number): "success" | "warning" | "error" {
  if (score >= 75) return "success";
  if (score >= 55) return "warning";
  return "error";
}

export function scoreToken(score: number): string {
  return `${scoreColor(score)}.main`;
}

export function scoreHex(score: number): string {
  if (score >= 75) return "#22c55e";
  if (score >= 55) return "#f59e0b";
  return "#ef4444";
}

export function projectVerdictBands(project: Project): Record<VerdictBandKey, number> {
  return getAdoptedProfile(project.id)?.version.verdictBands ?? DEFAULT_VERDICT_BANDS;
}

export function bandForScore(score: number, bands: Record<VerdictBandKey, number>): VerdictBandKey {
  if (score >= bands.ship) return "ship";
  if (score >= bands.review) return "review";
  return "block";
}

export function projectRunState(project: Project): RunState {
  return project.runs[0]?.status ?? "collecting";
}

/** Any safety override on the latest run - the run currently gating the ship decision. */
export function criticalSafety(project: Project): SafetyOverride | null {
  const latestRun = project.runs[0];
  if (!latestRun) return null;
  const override = latestRun.sessions.find((s) => s.safetyOverride?.severity === "Critical")?.safetyOverride;
  return override ?? null;
}

function highSafety(project: Project): SafetyOverride | null {
  const latestRun = project.runs[0];
  if (!latestRun) return null;
  const override = latestRun.sessions.find((s) => s.safetyOverride?.severity === "High")?.safetyOverride;
  return override ?? null;
}

export interface AgentVerdict {
  state: RunState;
  band: VerdictBandKey | null;
  score: number | null;
  grade: "A" | "B" | "C" | "D" | "F" | null;
  reason: string;
  safety: SafetyOverride | null;
  bands: Record<VerdictBandKey, number>;
}

function bandReason(band: VerdictBandKey, bands: Record<VerdictBandKey, number>): string {
  if (band === "ship") return `Above ship threshold (${bands.ship})`;
  if (band === "review") return `Below ship threshold (${bands.ship}) - needs review`;
  return `Below review threshold (${bands.review}) - do not ship`;
}

function lifecycleReason(state: RunState, totalSessions: number): string {
  if (state === "collecting") return `${totalSessions} of ${TRACES_NEEDED} traces collected`;
  if (state === "scoring") return "Scoring in progress";
  if (state === "error") return "Last run did not complete";
  return "";
}

export function agentVerdict(project: Project): AgentVerdict {
  const state = projectRunState(project);
  const bands = projectVerdictBands(project);
  const totalSessions = project.runs.flatMap((r) => r.sessions).length;
  const critical = criticalSafety(project);
  const high = highSafety(project);

  if (state !== "scored") {
    return {
      state,
      band: null,
      score: null,
      grade: null,
      reason: critical
        ? "Safety override - do not ship"
        : high
        ? "Safety warning - review before shipping"
        : lifecycleReason(state, totalSessions),
      safety: critical ?? high,
      bands,
    };
  }

  const score = projectCompositeScore(project);
  const grade = sessionGrade(score);

  if (critical) {
    return { state, band: "block", score, grade, reason: "Safety override - do not ship", safety: critical, bands };
  }

  let band = bandForScore(score, bands);
  if (high && band === "ship") band = "review";

  const reason = high && band === "review" ? "Safety warning - review before shipping" : bandReason(band, bands);

  return { state, band, score, grade, reason, safety: high ?? null, bands };
}

export interface SessionVerdict {
  band: VerdictBandKey;
  score: number;
  grade: "A" | "B" | "C" | "D" | "F";
  reason: string;
  safety: SafetyOverride | null;
  bands: Record<VerdictBandKey, number>;
}

export function sessionVerdict(session: Session, bands: Record<VerdictBandKey, number>): SessionVerdict {
  const score = sessionCompositeScore(session);
  const grade = sessionGrade(score);
  const safety = session.safetyOverride ?? null;

  if (safety?.severity === "Critical") {
    return { band: "block", score, grade, reason: "Safety override - do not ship", safety, bands };
  }

  let band = bandForScore(score, bands);
  if (safety?.severity === "High" && band === "ship") band = "review";

  const reason = safety?.severity === "High" && band === "review" ? "Safety warning - review before shipping" : bandReason(band, bands);

  return { band, score, grade, reason, safety, bands };
}

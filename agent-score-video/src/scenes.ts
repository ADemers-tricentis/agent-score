// Scene timing (30fps). Durations sized to measured voiceover clips + animation padding.
export const SCENES = [
  { id: "hook", durationInFrames: 422, audio: "vo1.wav", audioDelay: 40 },
  { id: "problem", durationInFrames: 843, audio: "vo2.wav", audioDelay: 15 },
  { id: "reveal", durationInFrames: 551, audio: "vo3.wav", audioDelay: 18 },
  { id: "dimensions", durationInFrames: 542, audio: "vo4.wav", audioDelay: 15 },
  { id: "attribution", durationInFrames: 391, audio: "vo5.wav", audioDelay: 15 },
  { id: "flow", durationInFrames: 496, audio: "vo6.wav", audioDelay: 15 },
  { id: "cta", durationInFrames: 271, audio: "vo7.wav", audioDelay: 12 },
] as const;

export const TOTAL_FRAMES = SCENES.reduce(
  (sum, s) => sum + s.durationInFrames,
  0,
);

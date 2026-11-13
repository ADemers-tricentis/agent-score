export const FUNNEL_STAGES = [
  { id: "interested", label: "Interested" },
  { id: "email_sent", label: "Email sent" },
  { id: "follow_up_sent", label: "Follow-up sent" },
  { id: "replied", label: "Replied" },
  { id: "demo_scheduled", label: "Demo scheduled" },
  { id: "pending_beta", label: "Pending beta" },
  { id: "invited_to_beta", label: "Invited to beta" },
  { id: "actively_using", label: "Actively using" },
] as const;

export const EXIT_STATES = [
  { id: "not_a_fit", label: "Not a fit" },
  { id: "do_not_email", label: "Do not email" },
] as const;

export type FunnelStage = (typeof FUNNEL_STAGES)[number]["id"];
export type ExitState = (typeof EXIT_STATES)[number]["id"];
export type Stage = FunnelStage | ExitState;

export const ALL_STAGES: readonly { id: Stage; label: string }[] = [...FUNNEL_STAGES, ...EXIT_STATES];

const ORDER = new Map<string, number>(FUNNEL_STAGES.map((s, i) => [s.id, i]));

export function stageIndex(stage: string): number {
  return ORDER.get(stage) ?? -1;
}

export function isExit(stage: string): stage is ExitState {
  return stage === "not_a_fit" || stage === "do_not_email";
}

export function isStage(value: string): value is Stage {
  return ALL_STAGES.some((s) => s.id === value);
}

export function stageLabel(stage: string): string {
  return ALL_STAGES.find((s) => s.id === stage)?.label ?? stage;
}

/** Parse a tracker or CSV status label ("Demo Scheduled — POC scoping") into a stage id. */
export function parseStageLabel(text: string): { stage: Stage; rest: string } | null {
  const t = text.trim();
  const candidates: [RegExp, Stage][] = [
    [/^interested/i, "interested"],
    [/^email sent/i, "email_sent"],
    [/^follow-?up sent/i, "follow_up_sent"],
    [/^replied/i, "replied"],
    [/^demo scheduled/i, "demo_scheduled"],
    [/^pending beta/i, "pending_beta"],
    [/^invited to beta/i, "invited_to_beta"],
    [/^beta check-in sent/i, "invited_to_beta"],
    [/^actively using/i, "actively_using"],
    [/^active beta/i, "actively_using"],
    [/^not a fit/i, "not_a_fit"],
    [/^do not email/i, "do_not_email"],
  ];
  for (const [re, stage] of candidates) {
    const m = t.match(re);
    if (m) {
      const rest = t.slice(m[0].length).replace(/^\s*[—–-]\s*/, "").trim();
      return { stage, rest };
    }
  }
  return null;
}

/** The funnel stage a contact touchpoint implies. Touchpoints only ever move a company forward. */
export const TOUCHPOINT_STAGE: Record<string, FunnelStage | undefined> = {
  intro_email: "email_sent",
  follow_up: "follow_up_sent",
  reply_received: "replied",
  demo_scheduled: "demo_scheduled",
  beta_invite: "invited_to_beta",
};

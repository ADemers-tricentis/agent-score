/** Declarative step list for the cross-page product tour (`tour-context.tsx`).
 * Mirrors the `stepsFor(role)` pattern in `GettingStartedChecklist.tsx` - plain
 * data, no JSX - so the state machine stays dumb about page content.
 */

export type TourPlacement = "top" | "bottom" | "left" | "right";

export interface TourStep {
  id: string;
  title: string;
  body: string;
  /** `[data-tour="..."]` value to spotlight. Omit for a centered card. */
  target?: string;
  to: string;
  params?: Record<string, string>;
  /** Required whenever `to` has a `validateSearch` (e.g. `/agents`). */
  search?: Record<string, unknown>;
  placement?: TourPlacement;
}

const BASE_STEPS: TourStep[] = [
  {
    id: "welcome",
    title: "Welcome to AgentScore",
    body: "AgentScore watches your agents' real traffic and turns it into a trust score you can act on. This tour shows where everything lives.",
    to: "/",
  },
  {
    id: "nav",
    title: "Everything starts here",
    body: "Agents, tenants, the eval catalog, and reporting all live in this sidebar.",
    target: "sidebar-nav",
    to: "/",
    placement: "right",
  },
  {
    id: "checklist",
    title: "Your first steps",
    body: "New accounts land here with a short checklist for getting a real agent scored.",
    target: "getting-started",
    to: "/",
    placement: "bottom",
  },
  {
    id: "sample-agent",
    title: "A fully scored agent",
    body: "This sample agent already has enough traffic to produce a real score - explore it before connecting your own.",
    target: "agents-table",
    to: "/agents",
    search: { view: "list", by: "tenant" },
    placement: "top",
  },
  {
    id: "evals",
    title: "What gets checked",
    body: "These are the evals behind every score, grouped by dimension. There's nothing to configure to get your first result.",
    target: "eval-catalog",
    to: "/evals/catalog/evals",
    placement: "top",
  },
  {
    id: "done",
    title: "You're set",
    body: "Connect a real agent and its score will sharpen as traffic comes in.",
    to: "/",
  },
];

/** The "checklist" step only exists in blank mode - the card it targets isn't
 * rendered otherwise, so it's dropped rather than left to time out. */
export function tourStepsFor(blank: boolean): TourStep[] {
  return BASE_STEPS.filter((step) => step.id !== "checklist" || blank);
}

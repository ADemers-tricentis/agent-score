/** Docs section structure — mirrors the real customer-facing docs site's
 * section/page layout (`agent-score-marketing/docs-src/src/nav.ts`) so the
 * demo's nav reads as the real product. Page bodies are placeholders; only
 * the structure (sections, titles, one-line blurbs) is carried over here.
 */

export interface DocsPage {
  slug: string;
  title: string;
  blurb: string;
}

export interface DocsSection {
  id: string;
  title: string;
  pages: DocsPage[];
}

export const DOCS_NAV: DocsSection[] = [
  {
    id: "get-started",
    title: "Get Started",
    pages: [
      { slug: "welcome", title: "Welcome", blurb: "What Agent Score does and why it exists." },
      { slug: "connect-your-agent", title: "Connect Your Agent", blurb: "Get traces flowing in - no SDK required." },
    ],
  },
  {
    id: "evaluations",
    title: "Evaluations",
    pages: [
      { slug: "eval-catalog", title: "The Evaluation Catalog", blurb: "60+ ready-made evals, from strict rules to human-like judgment." },
      { slug: "dimensions-and-profiles", title: "Dimensions & Profiles", blurb: "How individual evals roll up into a single score." },
      { slug: "custom-evals", title: "Building a Custom Eval", blurb: "Describe what you want to measure in plain language." },
      { slug: "scoring-engine", title: "Scoring Engine Settings", blurb: "Pass thresholds, judge models, and usage." },
    ],
  },
  {
    id: "scoring-journey",
    title: "The Scoring Journey",
    pages: [
      { slug: "agent-card", title: "Meet Your Agent Card", blurb: "How Agent Score learns what your agent is for." },
      { slug: "scorecard", title: "Reading Your Scorecard", blurb: "The score, the verdict, and the evidence behind both." },
      { slug: "scoring-over-time", title: "Scoring Over Time", blurb: "Scheduled runs and why accuracy keeps improving." },
    ],
  },
  {
    id: "reference",
    title: "Reference",
    pages: [{ slug: "glossary", title: "Glossary", blurb: "Every term, defined in one place." }],
  },
];

export const ALL_DOCS_PAGES: DocsPage[] = DOCS_NAV.flatMap((section) => section.pages);

export function findDocsPage(slug: string): DocsPage | undefined {
  return ALL_DOCS_PAGES.find((p) => p.slug === slug);
}

export const DEFAULT_DOCS_SLUG = "welcome";

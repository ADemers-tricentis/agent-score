// Verbatim from docs/research/competitive-analysis-report.md, "## Compare & Contrast".
// Split into the same two groupings the prior (content-approved) pptx build used:
// scoring/eval-capability rows on slide 5, enterprise/deployment/ecosystem rows on slide 6.

export const COLUMNS = [
  "AgentScore",
  "Langfuse",
  "Braintrust",
  "Arize",
  "Galileo",
  "LangSmith",
  "W&B Weave",
  "Arato",
  "Patronus",
  "int4 TrustGate†",
];

export type CompareRow = { label: string; values: string[] };

export const SCORING_ROWS: CompareRow[] = [
  { label: "Core stance", values: ["Auto-grade real behavior, zero setup", "OSS observability", "Eval-first + CI", "Observability + eval", "Continuous scoring + guardrails", "Tracing for LangChain", "Drop-in trace + eval", "Sim-first testing", "Judge models + sim", "SAP write-txn guardrail"] },
  { label: "Trace/run scoring", values: ["✅ (20-trace floor)", "✅", "✅", "✅", "✅", "✅", "✅", "✅ (sim)", "✅", "🟡 document-level, not trace"] },
  { label: "Session-based scoring", values: ["✅", "✅", "✅", "✅ (session-level)", "✅", "✅", "✅", "✅ (multi-turn)", "✅", "❌"] },
  { label: "LLM-as-judge", values: ["✅ (G-Eval, Hybrid)", "✅", "✅", "✅", "✅ + SLM judges", "✅", "✅", "🟡 n/p", "✅ (Lynx/GLIDER)", "❌ deterministic"] },
  { label: "Multi-model judge catalog", values: ["✅ 7 models (Bedrock)", "✅", "✅", "✅", "✅", "✅", "✅", "n/p", "✅", "❌ (n/a)"] },
  { label: "Customer-selectable judge", values: ["✅", "✅", "✅", "✅", "✅", "✅", "✅", "n/p", "✅", "❌ (n/a)"] },
  { label: "Zero-config / auto-profile", values: ["✅ differentiated", "❌", "❌", "❌", "❌", "❌", "❌", "🟡", "❌", "❌"] },
  { label: "Simulation / synthetic users", values: ["❌", "❌", "❌", "❌", "❌", "❌", "❌", "✅", "✅", "🟡 prod replay (Prove)"] },
  { label: "Guardrails / runtime protect", values: ["❌", "❌", "🟡", "🟡", "✅", "❌", "❌", "❌", "🟡", "✅ core"] },
];

export const ENTERPRISE_ROWS: CompareRow[] = [
  { label: "RBAC", values: ["❌ not built", "🟡 paid", "✅ Ent", "✅ Ent", "✅ Pro+", "🟡 Ent", "🟡 Ent", "n/p", "🟡", "n/p"] },
  { label: "SSO/SAML", values: ["❌ not built", "🟡 add-on", "✅ Ent", "✅ Ent", "✅ Ent", "✅ Ent", "✅ Ent", "n/p", "🟡 OIDC", "n/p"] },
  { label: "API key mgmt", values: ["🟡 ingest keys only", "✅", "✅", "✅", "✅", "✅", "✅", "n/p", "✅", "n/p"] },
  { label: "SDK breadth", values: ["❌ none (OTel only); Read API reserved", "Py, JS", "6 langs", "Py/TS/Java", "Py/TS", "Py/JS(+)", "Py/TS", "API+SDK", "Py/TS/Java", "❌ SAP-only, no SDK"] },
  { label: "OTel-native ingest", values: ["✅ (only path)", "✅", "✅", "✅", "✅", "✅", "✅", "🟡", "✅", "❌ (SAP proxy)"] },
  { label: "Self-host / on-prem", values: ["❌ cloud-only (VPN-gated)", "✅", "✅ Ent", "✅", "✅", "✅ Ent", "✅ Ent", "n/p", "✅", "n/p (in-line ERP proxy)"] },
  { label: "Deployment maturity", values: ["🟡 internal beta, 0 ext customers", "GA", "GA", "GA", "GA", "GA", "GA", "early", "GA", "🟡 new (~H2 2026)"] },
  { label: "Ecosystem hook", values: ["✅ AIW, any OTel-compatible agent", "LangChain-agnostic", "broad", "broad", "Splunk/Cisco", "LangChain", "W&B/CoreWeave", "any stack", "Datadog", "✅ SAP (Joule/Agentforce)"] },
];

export const LEGEND = "✅ shipped / mature   🟡 partial, gated, or in progress   ❌ absent   n/p not public";
export const FOOTNOTE =
  "† int4 TrustGate is AI TRiSM / SAP runtime guardrails, not a general agent-quality evaluator - included for reference, not as a like-for-like rival.";

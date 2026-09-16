import { useState } from "react";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Divider from "@mui/material/Divider";
import Chip from "@mui/material/Chip";
import Collapse from "@mui/material/Collapse";
import SvgIcon from "@mui/material/SvgIcon";
import AuraTabPanel from "@tricentis/aura/components/TabPanel.js";
import type { View } from "../types";

interface Props {
  navigate: (v: View) => void;
}

function CheckIcon() {
  return <SvgIcon fontSize="small" sx={{ color: "success.main" }}><path d="M9 16.17 4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" /></SvgIcon>;
}
function ExpandMoreIcon() { return <SvgIcon fontSize="small"><path d="M16.59 8.59 12 13.17 7.41 8.59 6 10l6 6 6-6z" /></SvgIcon>; }
function ExpandLessIcon() { return <SvgIcon fontSize="small"><path d="M12 8 6 14l1.41 1.41L12 10.83l4.59 4.58L18 14z" /></SvgIcon>; }

interface Step {
  title: string;
  detail: string;
}

interface RoleGuide {
  label: string;
  intro: string;
  steps: Step[];
  faqs: { q: string; a: string }[];
}

const ROLE_GUIDES: RoleGuide[] = [
  {
    label: "Sales & SE",
    intro: "What you need to run a credible AgentScore demo or discovery call without pulling in engineering.",
    steps: [
      { title: "Pick a demo agent matching the prospect's use case", detail: "Go to Agents → Try a demo agent. Choose the closest industry/agent-type match so the prospect sees their own use case reflected, not a generic example." },
      { title: "Walk the scorecard, not the setup", detail: "Open the demo agent's overview and Scorecard tab. Lead with the composite score, verdict band, and the plain-language dimension labels — avoid the raw eval taxonomy unless asked." },
      { title: "Show the guided profile builder if asked \"how do you configure this?\"", detail: "Agents → Add Agent → Describe your agent. Type a one-line purpose live during the call; the generated evals are the answer to \"how does it know what to check?\"" },
      { title: "Know the one-liner for setup effort", detail: "\"One API key per tenant, paste one instruction into your coding agent, and traces start flowing automatically.\" Point to the skill-install snippet in Add Agent if pressed for detail." },
    ],
    faqs: [
      { q: "What if the prospect's agent type isn't in the demo gallery?", a: "Use the closest AI Workspace demo and reframe the description live in Add Agent's guided mode — it's built to generalize." },
      { q: "Can I reset a demo agent's data?", a: "Demo agents created from the gallery are independent projects; just launch a fresh one from Try a demo agent rather than editing an existing one mid-call." },
    ],
  },
  {
    label: "Support",
    intro: "Enough context to answer 'why is my score X' and 'how do I connect my agent' without escalating.",
    steps: [
      { title: "Understand the two blockers customers hit first", detail: "(1) Fewer than 20 traces collected — scoring is locked until then. (2) No profile adopted — verdict bands fall back to defaults (Ship ≥85, Review ≥55, Block below)." },
      { title: "Read the plain-language dimension labels before diagnosing", detail: "In guided mode, dimensions map to \"Getting the right answer,\" \"Cost & speed,\" \"Smart decisions,\" etc. — see DimensionsView for the full mapping to internal names." },
      { title: "Point customers to skill-based setup for connection issues", detail: "Most \"my traces aren't showing up\" tickets are solved by re-copying the agent instruction snippet or the OTel exporter config from Add Agent → Connect." },
      { title: "Escalate safety overrides, don't explain them away", detail: "A Critical safety override always forces Block regardless of composite score — this is by design, not a bug." },
    ],
    faqs: [
      { q: "A customer's score didn't change after a fix — why?", a: "Scores use a rolling window of sessions; check whether new traces have actually landed (Traces 24H) before assuming the profile is stale." },
      { q: "Where do I find what a specific eval actually checks?", a: "Agent → Evaluation Design, or Profiles → the adopted profile version. Each entry has a plain task definition and judge criteria." },
    ],
  },
  {
    label: "Engineering",
    intro: "Where the onboarding surfaces live in this codebase, for anyone extending them.",
    steps: [
      { title: "Trace ingestion & agent detection", detail: "src/views/AddAgentView.tsx — INGEST_PIPELINE_STAGES simulates the connect → detect → score pipeline. Real ingestion is OTLP/HTTP against the ingest endpoint shown in the Connect step." },
      { title: "Conversational + guided profile building", detail: "AddAgentView.tsx and AddProfileView.tsx both implement guided (plain-language, described-in-your-own-words) and expert (YAML/JSON/Markdown spec) profile generation." },
      { title: "Demo agents & synthetic traces", detail: "src/views/DemoGalleryView.tsx defines DEMO_TEMPLATES; src/data/mock.ts's addMockTracesToProject() generates the synthetic scored run per project type via MOCK_SCENARIOS." },
      { title: "This onboarding guide", detail: "src/views/GettingStartedView.tsx. Add a new role tab by extending ROLE_GUIDES below — no new routing needed." },
    ],
    faqs: [
      { q: "How do I add a new demo agent template?", a: "Add an entry to DEMO_TEMPLATES in DemoGalleryView.tsx with a ProjectType, industry tag, and description — the scoring/profile wiring is automatic." },
      { q: "How do I add a new internal team's onboarding path?", a: "Add a RoleGuide object to ROLE_GUIDES in this file." },
    ],
  },
];

export default function GettingStartedView({ navigate }: Props) {
  const [tab, setTab] = useState(0);
  const [openFaq, setOpenFaq] = useState<string | null>(null);
  const guide = ROLE_GUIDES[tab];

  return (
    <Box sx={{ p: 3, maxWidth: 900 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>
          Getting started
        </Typography>
        <Typography variant="body2" sx={{ color: "text.secondary" }}>
          Self-serve onboarding for internal Tricentis teams — pick your role below. No 1:1 walkthrough required.
        </Typography>
      </Box>

      <Tabs value={tab} onChange={(_, v: number) => setTab(v)} sx={{ borderBottom: "1px solid", borderColor: "divider", mb: 3 }}>
        {ROLE_GUIDES.map((g) => (
          <Tab key={g.label} label={g.label} />
        ))}
      </Tabs>

      {ROLE_GUIDES.map((g, i) => (
        <AuraTabPanel key={g.label} value={tab} index={i} sx={{ p: 0 }}>
          <Typography variant="body2" sx={{ color: "text.secondary", mb: 2.5 }}>
            {g.intro}
          </Typography>

          <Paper variant="outlined" sx={{ borderRadius: 1.5, overflow: "hidden", mb: 3 }}>
            {g.steps.map((step, idx) => (
              <Box
                key={step.title}
                sx={{
                  display: "flex",
                  gap: 1.5,
                  p: 2,
                  borderBottom: idx < g.steps.length - 1 ? "1px solid" : "none",
                  borderColor: "divider",
                }}
              >
                <CheckIcon />
                <Box sx={{ flex: 1 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.25 }}>{step.title}</Typography>
                  <Typography variant="body2" sx={{ color: "text.secondary" }}>{step.detail}</Typography>
                </Box>
              </Box>
            ))}
          </Paper>

          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>FAQ</Typography>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
            {g.faqs.map((faq) => {
              const key = `${g.label}-${faq.q}`;
              const open = openFaq === key;
              return (
                <Paper key={key} variant="outlined" sx={{ borderRadius: 1.5, overflow: "hidden" }}>
                  <Box
                    onClick={() => setOpenFaq(open ? null : key)}
                    sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", px: 2, py: 1.25, cursor: "pointer", "&:hover": { bgcolor: "action.hover" } }}
                  >
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{faq.q}</Typography>
                    {open ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                  </Box>
                  <Collapse in={open}>
                    <Divider />
                    <Typography variant="body2" sx={{ color: "text.secondary", p: 2 }}>{faq.a}</Typography>
                  </Collapse>
                </Paper>
              );
            })}
          </Box>
        </AuraTabPanel>
      ))}

      <Divider sx={{ my: 3 }} />

      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 1.5 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Chip label="Self-serve" size="small" color="primary" variant="outlined" sx={{ height: 20, fontSize: "0.65rem" }} />
          <Typography variant="caption" sx={{ color: "text.disabled" }}>
            Ramp up here first — reach out only if something's missing.
          </Typography>
        </Box>
        <Button size="small" variant="outlined" onClick={() => navigate({ name: "demo-gallery" })}>
          Try a demo agent →
        </Button>
      </Box>
    </Box>
  );
}

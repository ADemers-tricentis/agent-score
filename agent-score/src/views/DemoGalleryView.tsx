import { useState } from "react";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import SvgIcon from "@mui/material/SvgIcon";
import type { View, Project, ProjectType } from "../types";
import { PROJECTS, PROFILES, addProject, addMockTracesToProject } from "../data/mock";
import TypeTag from "../components/TypeTag";

interface Props {
  navigate: (v: View) => void;
}

interface DemoTemplate {
  id: string;
  name: string;
  type: ProjectType;
  industry: string;
  description: string;
  scenarioFlavor: string;
}

const DEMO_TEMPLATES: DemoTemplate[] = [
  {
    id: "demo-support-triage",
    name: "Support Triage Agent",
    type: "ATA",
    industry: "Customer support",
    description: "Reads inbound tickets and routes them to the right queue, drafting a first response for simple cases.",
    scenarioFlavor: "Ticket routing & first-response drafting",
  },
  {
    id: "demo-fintech-checkout",
    name: "Fintech Checkout Tester",
    type: "ATA",
    industry: "Financial services",
    description: "Runs regression suites against a payment workflow — transaction validation, overdraft handling, settlement.",
    scenarioFlavor: "Payment workflow regression testing",
  },
  {
    id: "demo-test-case-author",
    name: "Test Case Generator",
    type: "ATC",
    industry: "QA / test engineering",
    description: "Generates test cases from requirements docs and flags coverage gaps before a release.",
    scenarioFlavor: "Requirement-to-test-case generation",
  },
  {
    id: "demo-code-review",
    name: "Code Review Assistant",
    type: "CODING",
    industry: "Software engineering",
    description: "Reviews pull requests for bugs, security issues, and unnecessary diff surface area.",
    scenarioFlavor: "PR review & security scanning",
  },
  {
    id: "demo-incident-rca",
    name: "Incident RCA Agent",
    type: "CURA",
    industry: "SRE / DevOps",
    description: "Diagnoses production incidents from logs and metrics, attributing root cause across services.",
    scenarioFlavor: "Root-cause diagnosis from CI/prod signals",
  },
  {
    id: "demo-healthcare-intake",
    name: "Patient Intake Assistant",
    type: "AI_WORKSPACE",
    industry: "Healthcare",
    description: "Summarizes patient intake forms and drafts structured notes for clinician review.",
    scenarioFlavor: "Intake summarization & note drafting",
  },
  {
    id: "demo-load-tester",
    name: "Load & Performance Tester",
    type: "APT",
    industry: "Platform engineering",
    description: "Runs load profiles against services and flags throughput or latency regressions before ship.",
    scenarioFlavor: "Load profiling & latency regression detection",
  },
  {
    id: "demo-retail-recs",
    name: "Retail Recommendation Agent",
    type: "AI_WORKSPACE",
    industry: "Retail / e-commerce",
    description: "Answers product questions and generates personalized recommendations from catalog and order history.",
    scenarioFlavor: "Product Q&A & recommendation generation",
  },
];

function findProfileIdForType(type: ProjectType): string | undefined {
  return PROFILES.find((p) => p.agentType === type)?.id;
}

function judgeIdForType(type: ProjectType): string {
  if (type === "CODING" || type === "ATC") return "j3";
  if (type === "APT") return "j2";
  return "j1";
}

function slugify(s: string) {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

function PlayIcon() {
  return <SvgIcon fontSize="small"><path d="M8 5v14l11-7z" /></SvgIcon>;
}

function DemoCard({ template, onTry }: { template: DemoTemplate; onTry: () => void }) {
  const [launching, setLaunching] = useState(false);
  return (
    <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2, display: "flex", flexDirection: "column", gap: 1.25 }}>
      <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 1 }}>
        <Box>
          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{template.name}</Typography>
          <Typography variant="caption" sx={{ color: "text.disabled" }}>{template.industry}</Typography>
        </Box>
        <TypeTag type={template.type} />
      </Box>
      <Typography variant="body2" sx={{ color: "text.secondary", flex: 1 }}>{template.description}</Typography>
      <Chip
        label={template.scenarioFlavor}
        size="small"
        variant="outlined"
        sx={{ height: 20, fontSize: "0.62rem", alignSelf: "flex-start" }}
      />
      <Button
        size="small"
        variant="contained"
        startIcon={<PlayIcon />}
        disabled={launching}
        onClick={() => {
          setLaunching(true);
          onTry();
        }}
        sx={{ mt: 0.5 }}
      >
        {launching ? "Loading demo…" : "Try this demo"}
      </Button>
    </Paper>
  );
}

export default function DemoGalleryView({ navigate }: Props) {
  function handleTry(template: DemoTemplate) {
    const projectId = `demo-${Date.now()}`;
    const project: Project = {
      id: projectId,
      name: template.name,
      service: slugify(template.name),
      type: template.type,
      phase: 1,
      reliability: "NEEDS_WORK",
      runs: [],
      adoptedProfileId: findProfileIdForType(template.type),
      llmJudgeId: judgeIdForType(template.type),
      traceSampleRate: 100,
    };
    addProject(project);
    addMockTracesToProject(projectId);
    navigate({ name: "agent-detail", projectId });
  }

  const existingDemos = PROJECTS.filter((p) => p.id.startsWith("demo-"));

  return (
    <Box sx={{ p: 3, maxWidth: 1200 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>
          Try a demo agent
        </Typography>
        <Typography variant="body2" sx={{ color: "text.secondary", maxWidth: 720 }}>
          Spin up a demo agent preloaded with synthetic traces and a scored run — no setup, no real data required.
          Pick the one closest to your own use case to see how AgentScore would score it.
        </Typography>
      </Box>

      {existingDemos.length > 0 && (
        <Paper variant="outlined" sx={{ p: 2, borderRadius: 1.5, mb: 3, bgcolor: "action.hover" }}>
          <Typography variant="caption" sx={{ color: "text.secondary" }}>
            You already have {existingDemos.length} demo agent{existingDemos.length !== 1 ? "s" : ""} running.{" "}
            <Box component="span" sx={{ color: "primary.main", fontWeight: 600, cursor: "pointer" }} onClick={() => navigate({ name: "agents" })}>
              View in Agents →
            </Box>
          </Typography>
        </Paper>
      )}

      <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 2 }}>
        {DEMO_TEMPLATES.map((template) => (
          <DemoCard key={template.id} template={template} onTry={() => handleTry(template)} />
        ))}
      </Box>
    </Box>
  );
}

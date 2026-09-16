import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Divider from "@mui/material/Divider";
import SvgIcon from "@mui/material/SvgIcon";
import type { AgentTab, View } from "../types";
import { getProject } from "../data/mock";
import { agentVerdict } from "../data/verdict";
import { RUN_STATE_META } from "../data/verdict";
import VerdictChip from "../components/VerdictChip";
import ScoreTab from "./agent-tabs/ScoreTab";
import ImproveTab from "./agent-tabs/ImproveTab";
import AgentCardTab from "./agent-tabs/AgentCardTab";
import TracesTab from "./agent-tabs/TracesTab";
import ProfileTab from "./agent-tabs/ProfileTab";
import LabelingTab from "./agent-tabs/LabelingTab";
import SettingsTab from "./agent-tabs/SettingsTab";

interface Props {
  projectId: string;
  tab?: AgentTab;
  initialTraceId?: string;
  navigate: (v: View) => void;
}

const SCORE_ICON = "M20.38 8.57l-1.23 1.85a8 8 0 0 1-.22 7.58H5.07A8 8 0 0 1 15.58 6.85l1.85-1.23A10 10 0 0 0 3.35 19a2 2 0 0 0 1.72 1h13.85a2 2 0 0 0 1.74-1 10 10 0 0 0 .6-10.44zm-9.79 6.84a2 2 0 0 0 2.83 0l5.66-8.49-8.49 5.66a2 2 0 0 0 0 2.83z";
const IMPROVE_ICON = "M9 21c0 .55.45 1 1 1h4c.55 0 1-.45 1-1v-1H9v1zm3-19C8.14 2 5 5.14 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.86-3.14-7-7-7z";
const CARD_ICON = "M20 4H4c-1.1 0-1.99.9-1.99 2v12c0 1.1.89 2 1.99 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z";
const TRACES_ICON = "M4 6h16v2H4V6zm0 5h16v2H4v-2zm0 5h16v2H4v-2z";
const PROFILE_ICON = "M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z";
const LABELING_ICON = "M17.63 5.84C17.27 5.33 16.67 5 16 5L5 5.01C3.9 5.01 3 5.9 3 7v10c0 1.1.9 1.99 2 1.99L16 19c.67 0 1.27-.33 1.63-.84L22 12l-4.37-6.16z";
const SETTINGS_ICON = "M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94L14.4 2.81c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41L9.25 5.35C8.66 5.59 8.12 5.92 7.63 6.29L5.24 5.33c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.07.63-.07.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.03-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z";

const TABS: { value: AgentTab; label: string; icon: string }[] = [
  { value: "score", label: "Score", icon: SCORE_ICON },
  { value: "improve", label: "Improve", icon: IMPROVE_ICON },
  { value: "card", label: "Agent Card", icon: CARD_ICON },
  { value: "traces", label: "Traces", icon: TRACES_ICON },
  { value: "profile", label: "Profile", icon: PROFILE_ICON },
  { value: "labeling", label: "Labeling", icon: LABELING_ICON },
  { value: "settings", label: "Settings", icon: SETTINGS_ICON },
];

export default function AgentShellView({ projectId, tab = "score", initialTraceId, navigate }: Props) {
  const project = getProject(projectId);

  if (!project) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>Agent not found.</Typography>
        <Button variant="outlined" sx={{ mt: 2 }} onClick={() => navigate({ name: "agents" })}>Back to agents</Button>
      </Box>
    );
  }

  const verdict = agentVerdict(project);

  const createdDate = (() => {
    const d = project.runs[project.runs.length - 1]?.date ?? project.events?.[0]?.ts;
    if (!d) return null;
    return new Date(d).toLocaleDateString("en-US", { month: "numeric", day: "numeric", year: "numeric", timeZone: "UTC" });
  })();

  const agent = project;

  function renderTab() {
    switch (tab) {
      case "score":
        return <ScoreTab project={agent} navigate={navigate} />;
      case "improve":
        return <ImproveTab project={agent} />;
      case "card":
        return <AgentCardTab project={agent} />;
      case "traces":
        return <TracesTab project={agent} initialTraceId={initialTraceId} />;
      case "profile":
        return <ProfileTab project={agent} />;
      case "labeling":
        return <LabelingTab project={agent} />;
      case "settings":
        return <SettingsTab project={agent} />;
    }
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <Box sx={{ px: 3, pt: 2.5, pb: 0, bgcolor: "background.paper" }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 0.5 }}>
          <Box sx={{ width: 32, height: 32, borderRadius: 1, border: "1px solid", borderColor: "divider", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <SvgIcon sx={{ fontSize: "1rem", color: "text.secondary" }}>
              <path d="M20 9V7c0-1.1-.9-2-2-2h-3c0-1.66-1.34-3-3-3S9 3.34 9 5H6c-1.1 0-2 .9-2 2v2c-1.66 0-3 1.34-3 3s1.34 3 3 3v4c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2v-4c1.66 0 3-1.34 3-3s-1.34-3-3-3zm-2 10H6V7h12v12zm-9-6c-.83 0-1.5-.67-1.5-1.5S8.17 10 9 10s1.5.67 1.5 1.5S9.83 13 9 13zm6 0c-.83 0-1.5-.67-1.5-1.5S14.17 10 15 10s1.5.67 1.5 1.5S15.83 13 15 13zm-5 3h4v-2h-4v2z" />
            </SvgIcon>
          </Box>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>{project.name}</Typography>
          <Chip label="external" size="small" variant="outlined" sx={{ height: 20, fontSize: "0.7rem" }} />
          {verdict.band ? (
            <VerdictChip band={verdict.band} />
          ) : (
            <Chip
              label={RUN_STATE_META[verdict.state].label}
              size="small"
              color={RUN_STATE_META[verdict.state].muiColor}
              variant="outlined"
              sx={{ height: 22, fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.02em" }}
            />
          )}
          <Button size="small" variant="outlined" onClick={() => navigate({ name: "chat-scoring", projectId })} sx={{ ml: "auto", flexShrink: 0 }}>
            Chat about scoring
          </Button>
        </Box>
        <Typography variant="caption" sx={{ color: "text.secondary", display: "block", mb: 1.5, pl: 6 }}>
          {project.type}{createdDate ? ` · Created ${createdDate}` : ""} · {verdict.reason}
        </Typography>

        <Tabs
          value={tab}
          onChange={(_, v) => navigate({ name: "agent", projectId, tab: v as AgentTab })}
          sx={{ minHeight: 36, "& .MuiTab-root": { minHeight: 36, fontSize: "0.85rem", textTransform: "none", py: 0 } }}
        >
          {TABS.map(({ value, label, icon }) => (
            <Tab key={value} value={value} label={label} icon={<SvgIcon sx={{ fontSize: "0.95rem !important" }}><path d={icon} /></SvgIcon>} iconPosition="start" />
          ))}
        </Tabs>
        <Divider />
      </Box>

      <Box sx={{ flex: 1, overflow: "auto", p: 3 }}>{renderTab()}</Box>
    </Box>
  );
}

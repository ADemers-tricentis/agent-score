import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";

export type AgentTab = "overview" | "traces" | "scoring" | "labeling" | "settings";

export const AGENT_TAB_LABEL: Record<AgentTab, string> = {
  overview: "Overview",
  traces: "Traces",
  scoring: "Scoring",
  labeling: "Labeling",
  settings: "Settings",
};

const TAB_ORDER: AgentTab[] = ["overview", "traces", "scoring", "labeling", "settings"];

/** Persistent tab bar for the agent detail area (REQ-066). Only "Overview" has real content this milestone. */
export default function AgentTabBar({ value, onChange }: { value: AgentTab; onChange: (v: AgentTab) => void }) {
  return (
    <Tabs
      value={value}
      onChange={(_, v: AgentTab) => onChange(v)}
      sx={{ minHeight: 36, "& .MuiTab-root": { minHeight: 36, fontSize: "0.85rem", textTransform: "none", py: 0 } }}
    >
      {TAB_ORDER.map((tab) => (
        <Tab key={tab} value={tab} label={AGENT_TAB_LABEL[tab]} />
      ))}
    </Tabs>
  );
}

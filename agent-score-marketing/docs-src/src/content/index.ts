import type { ComponentType } from "react";
import Welcome from "./Welcome";
import ConnectWithMcp from "./ConnectWithMcp";
import ConnectYourAgent from "./ConnectYourAgent";
import WorkspaceAssistant from "./WorkspaceAssistant";
import EvalCatalog from "./EvalCatalog";
import CustomEvals from "./CustomEvals";
import DimensionsAndProfiles from "./DimensionsAndProfiles";
import ScoringEngine from "./ScoringEngine";
import AgentCard from "./AgentCard";
import Scorecard from "./Scorecard";
import ScoringOverTime from "./ScoringOverTime";
import Traces from "./Traces";
import Improve from "./Improve";
import Labeling from "./Labeling";
import Glossary from "./Glossary";

export const pages: Record<string, ComponentType> = {
  welcome: Welcome,
  "connect-with-mcp": ConnectWithMcp,
  "connect-your-agent": ConnectYourAgent,
  "workspace-assistant": WorkspaceAssistant,
  "eval-catalog": EvalCatalog,
  "custom-evals": CustomEvals,
  "dimensions-and-profiles": DimensionsAndProfiles,
  "scoring-engine": ScoringEngine,
  "agent-card": AgentCard,
  scorecard: Scorecard,
  "scoring-over-time": ScoringOverTime,
  traces: Traces,
  improve: Improve,
  labeling: Labeling,
  glossary: Glossary,
};

import type { ComponentType } from "react";
import Welcome from "./Welcome";
import ConnectYourAgent from "./ConnectYourAgent";
import EvalCatalog from "./EvalCatalog";
import DimensionsAndProfiles from "./DimensionsAndProfiles";
import CustomEvals from "./CustomEvals";
import ScoringEngine from "./ScoringEngine";
import AgentCard from "./AgentCard";
import Scorecard from "./Scorecard";
import ScoringOverTime from "./ScoringOverTime";
import Glossary from "./Glossary";

export const pages: Record<string, ComponentType> = {
  welcome: Welcome,
  "connect-your-agent": ConnectYourAgent,
  "eval-catalog": EvalCatalog,
  "dimensions-and-profiles": DimensionsAndProfiles,
  "custom-evals": CustomEvals,
  "scoring-engine": ScoringEngine,
  "agent-card": AgentCard,
  scorecard: Scorecard,
  "scoring-over-time": ScoringOverTime,
  glossary: Glossary,
};

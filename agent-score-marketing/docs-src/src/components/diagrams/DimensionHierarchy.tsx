import { Screenshot } from "../PageChrome";
import dimensionHierarchy from "../../assets/dimension-hierarchy.png";

export function DimensionHierarchyDiagram() {
  return (
    <Screenshot
      src={dimensionHierarchy}
      alt="Dimension hierarchy: evals like Faithfulness, Tool Correctness, Toxicity, Answer Correctness, Plan Adherence, and PII Leakage roll up into dimensions Groundedness, Agentic/Tool-use, Safety, and Correctness, which are weighted together into a profile (e.g. RAG, Tool-Orchestrator, Conversational), producing a composite score and verdict"
      caption="Evals roll up into dimensions. Dimensions roll up into a profile. A profile produces the score."
    />
  );
}

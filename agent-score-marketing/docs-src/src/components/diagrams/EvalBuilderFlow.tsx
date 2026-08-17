import { Screenshot } from "../PageChrome";
import evalBuilderFlow from "../../assets/eval-builder-flow.png";

export function EvalBuilderFlowDiagram() {
  return (
    <Screenshot
      src={evalBuilderFlow}
      width={5520}
      height={2520}
      alt="Eval builder flow: 1. Describe in plain language what you want to measure, 2. Agent Score recommends the best eval type and criteria, 3. You refine by pushing back and tightening criteria, 4. Publish - the eval goes live in the catalog, ready to bind to a dimension"
      caption='Example: "Make sure our generated tests cover 100% of requirements."'
    />
  );
}

import { Screenshot } from "../PageChrome";
import ingestionFlow from "../../assets/ingestion-flow.png";

export function IngestionFlowDiagram() {
  return (
    <Screenshot
      src={ingestionFlow}
      width={5520}
      height={3680}
      alt="Ingestion flow: internal Tricentis-built agents and external OpenTelemetry-exported agents both feed the Agent Score ingestion service, which recognizes, names, and files every trace, resulting in agents named and categorized with scoring beginning automatically at 20 traces"
      caption="Two ways in - one place they end up."
    />
  );
}

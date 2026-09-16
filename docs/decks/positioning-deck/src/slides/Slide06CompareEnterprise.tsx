import { Slide, Title } from "../components/Slide";
import { CompareTable } from "../components/CompareTable";
import { ENTERPRISE_ROWS, LEGEND, FOOTNOTE } from "../data/compareData";
import { surface } from "../theme/theme";

export const Slide06CompareEnterprise: React.FC = () => (
  <Slide index={6} kicker="Compare & Contrast">
    <Title size={44}>How AgentScore compares - enterprise, deployment, and ecosystem</Title>
    <div style={{ fontSize: 16, fontWeight: 700, color: surface.textSecondary, marginTop: 14, marginBottom: 18 }}>
      {LEGEND}
    </div>
    <div style={{ flex: 1, minHeight: 0 }}>
      <CompareTable rows={ENTERPRISE_ROWS} />
    </div>
    <div style={{ fontSize: 14, color: surface.textSecondary, marginTop: 16, marginBottom: 8 }}>{FOOTNOTE}</div>
  </Slide>
);

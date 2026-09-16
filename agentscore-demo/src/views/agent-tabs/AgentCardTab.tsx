import { useState } from "react";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Alert from "@mui/material/Alert";
import type { Project } from "../../types";
import { getAgentCard, regenerateAgentCard, useMockData } from "../../data/mock";
import EmptyState from "../../components/EmptyState";
import TintChip from "../../components/TintChip";
import { useToast } from "../../components/Toast";

interface Props {
  project: Project;
}

const CARD_ICON = "M20 4H4c-1.1 0-1.99.9-1.99 2v12c0 1.1.89 2 1.99 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z";

export default function AgentCardTab({ project }: Props) {
  useMockData();
  const toast = useToast();
  const [regenerating, setRegenerating] = useState(false);

  const card = getAgentCard(project.id);
  const hasScoredRun = project.runs.some((r) => r.status === "scored");

  function handleRegenerate() {
    setRegenerating(true);
    setTimeout(() => {
      regenerateAgentCard(project.id);
      setRegenerating(false);
      toast.success("Agent card regenerated.");
    }, 1200);
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2, maxWidth: 900 }}>
      <Card variant="outlined">
        <CardContent>
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2, mb: card ? 1 : 0 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>Agent Card</Typography>
              <TintChip tint="muted" label="Automatically generated" />
              {card && <TintChip tint="success" label="generated" />}
            </Box>
            <Button variant={card ? "outlined" : "contained"} disabled={regenerating || !hasScoredRun} onClick={handleRegenerate}>
              {regenerating ? "Generating…" : "Regenerate card"}
            </Button>
          </Box>
          <Typography variant="caption" sx={{ color: "text.secondary" }}>
            {card ? `A snapshot based on captured interactions · Generated ${new Date(card.createdAt).toLocaleString()}` : "A snapshot of this agent, based on captured interactions."}
          </Typography>
        </CardContent>
      </Card>

      {regenerating && (
        <Alert severity="info">Generating the agent card. This usually takes about a minute.</Alert>
      )}

      {!regenerating && !card && (
        <EmptyState
          icon={CARD_ICON}
          title="No agent card yet"
          description="This agent hasn't been through a full-fidelity profile-fit yet. A card is generated automatically on the next fit, or you can build one now."
        />
      )}

      {!regenerating && card && (
        <>
          <Card variant="outlined">
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Purpose</Typography>
                <TintChip tint="warning" label="Generated interpretation" />
              </Box>
              <Typography variant="body2" sx={{ color: "text.secondary" }}>
                Synthesized by the model — a draft, not a verified declaration.
              </Typography>
              <Typography variant="body2" sx={{ mt: 1 }}>{card.purpose}</Typography>
            </CardContent>
          </Card>

          <Card variant="outlined">
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Observed tool activity</Typography>
                <TintChip tint="outline" label={`observed · ${card.tools.length} tools`} />
              </Box>
              <Typography variant="caption" sx={{ color: "text.secondary", display: "block", mb: 1.5 }}>
                Measured from traces. Tool-call success does not establish task success.
              </Typography>
              {card.tools.length === 0 ? (
                <Typography variant="body2" sx={{ color: "text.secondary" }}>No tool calls captured in the sampled traces.</Typography>
              ) : (
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600, color: "text.secondary" }}>Tool</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600, color: "text.secondary" }}>Calls</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600, color: "text.secondary" }}>Successful calls</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {card.tools.map((tool) => (
                      <TableRow key={tool.name} sx={{ "&:last-child td": { borderBottom: 0 } }}>
                        <TableCell><Typography variant="body2" sx={{ fontFamily: "monospace" }}>{tool.name}</Typography></TableCell>
                        <TableCell align="right">{tool.calls}</TableCell>
                        <TableCell align="right">{(tool.successRate * 100).toFixed(0)}%</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          <Card variant="outlined">
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1.5 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Generated interpretation</Typography>
                <TintChip tint="warning" label="Draft · not verified" />
              </Box>
              <InterpretationList title="Typical behavior" items={card.behavioralPatterns} />
              <InterpretationList title="Suggested success criteria" items={card.successCriteria} />
              <InterpretationList title="Potential failure modes" items={card.failureModes} />
            </CardContent>
          </Card>
        </>
      )}
    </Box>
  );
}

function InterpretationList({ title, items }: { title: string; items: string[] }) {
  return (
    <Box sx={{ mb: 1.5 }}>
      <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>{title}</Typography>
      {items.length === 0 ? (
        <Typography variant="caption" sx={{ color: "text.secondary" }}>None drafted.</Typography>
      ) : (
        <Box component="ul" sx={{ m: 0, pl: 2.5 }}>
          {items.map((item) => (
            <Typography key={item} component="li" variant="caption" sx={{ color: "text.secondary" }}>{item}</Typography>
          ))}
        </Box>
      )}
    </Box>
  );
}

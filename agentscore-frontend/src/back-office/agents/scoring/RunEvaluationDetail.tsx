import Accordion from "@mui/material/Accordion";
import AccordionDetails from "@mui/material/AccordionDetails";
import AccordionSummary from "@mui/material/AccordionSummary";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Divider from "@mui/material/Divider";
import Typography from "@mui/material/Typography";
import { Link as RouterLink } from "@tanstack/react-router";
import IconMaterialSymbolsKeyboardArrowDown from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsKeyboardArrowDown.mjs";
import IconMaterialSymbolsOpenInNew from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsOpenInNew.mjs";

import type {
  RunInteractionDetailOut,
  RunInteractionEvaluationOut,
} from "@/back-office/agents/scoring-api";
import { describeEvidenceRef } from "@/shared/api/evidence-ref";
import { Chip, ChipStrip } from "@/shared/components/chip";
import { evaluationResultLabel } from "./result-format";

function scoreLabel(score: number | null): string {
  return score == null ? "—" : score.toFixed(2);
}

export function RunEvaluationDetail({
  evaluation,
  interactionRef,
  traceNavigationRef,
  tenantId,
  agentId,
  onSelectInteraction,
}: {
  evaluation: RunInteractionEvaluationOut;
  interactionRef: string;
  traceNavigationRef: RunInteractionDetailOut["traceNavigationRef"];
  tenantId: string;
  agentId: string;
  onSelectInteraction?: (interactionRef: string) => void;
}) {
  return (
    <Card variant="outlined" data-testid="run-evaluation-detail">
      <CardContent sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 1,
            flexWrap: "wrap",
          }}
        >
          <Box sx={{ minWidth: 0 }}>
            <Typography component="h4" variant="h6">
              {evaluation.evalSlug}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Interaction {interactionRef}
            </Typography>
          </Box>
          {onSelectInteraction ? (
            <Button
              size="small"
              variant="text"
              onClick={() => onSelectInteraction(interactionRef)}
              data-testid="run-evaluation-view-interaction"
            >
              View interaction
            </Button>
          ) : null}
        </Box>

        <ChipStrip>
          <Chip tint="default">{evaluationResultLabel(evaluation.score)}</Chip>
          <Chip tint="outline">Score {scoreLabel(evaluation.score)}</Chip>
        </ChipStrip>

        <Box>
          <Typography variant="subtitle2">Explanation</Typography>
          <Typography
            variant="body2"
            color={evaluation.reason == null ? "text.secondary" : "text.primary"}
            data-testid="run-evaluation-explanation"
          >
            {evaluation.reason ?? "No explanation was recorded."}
          </Typography>
        </Box>

        <EvidenceLinks
          refs={evaluation.evidenceRefs ?? []}
          traceNavigationRef={traceNavigationRef}
          tenantId={tenantId}
          agentId={agentId}
          testIdPrefix="run-evaluation-evidence"
        />

        <Divider />

        <Accordion disableGutters elevation={0} data-testid="run-evaluation-disclosure">
          <AccordionSummary
            expandIcon={<IconMaterialSymbolsKeyboardArrowDown sx={{ fontSize: 16 }} />}
          >
            <Typography variant="subtitle2">Evaluation version and samples</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Evaluation version
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ fontFamily: evaluation.evalVersionId ? "monospace" : undefined }}
                >
                  {evaluation.evalVersionId ?? "Not recorded"}
                </Typography>
              </Box>
              <Typography variant="caption" color="text.secondary">
                {evaluation.sampleCount} samples · {evaluation.nullCount} without a score ·{" "}
                {evaluation.aggregation}
              </Typography>
              {evaluation.samples.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  No sample details were recorded.
                </Typography>
              ) : (
                evaluation.samples.map((sample: any) => (
                  <Card key={sample.id} variant="outlined">
                    <CardContent sx={{ display: "flex", flexDirection: "column", gap: 0.75 }}>
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: 1,
                        }}
                      >
                        <Typography variant="subtitle2">
                          Sample {sample.sampleIndex + 1}
                        </Typography>
                        <Typography variant="body2">
                          Score {scoreLabel(sample.score)}
                        </Typography>
                      </Box>
                      <Typography variant="body2" color="text.secondary">
                        {sample.reason ?? "No explanation was recorded."}
                      </Typography>
                      <EvidenceLinks
                        refs={sample.evidenceRefs ?? []}
                        traceNavigationRef={traceNavigationRef}
                        tenantId={tenantId}
                        agentId={agentId}
                        testIdPrefix={`run-evaluation-sample-${sample.sampleIndex}-evidence`}
                      />
                    </CardContent>
                  </Card>
                ))
              )}
            </Box>
          </AccordionDetails>
        </Accordion>
      </CardContent>
    </Card>
  );
}

function EvidenceLinks({
  refs,
  traceNavigationRef,
  tenantId,
  agentId,
  testIdPrefix,
}: {
  refs: unknown[];
  traceNavigationRef: RunInteractionDetailOut["traceNavigationRef"];
  tenantId: string;
  agentId: string;
  testIdPrefix: string;
}) {
  if (refs.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary">
        No evidence references were recorded.
      </Typography>
    );
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
      <Typography variant="subtitle2">Evidence</Typography>
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
        {refs.map((ref, index) => {
          const display = describeEvidenceRef(ref);
          const label =
            display.kind === "malformed"
              ? `${display.label} · malformed`
              : display.verified === false
                ? `${display.label} · unverified`
                : display.label;
          if (traceNavigationRef.timestamp == null) {
            return (
              <Chip
                key={index}
                tint={display.verified === false ? "warning" : "muted"}
                data-testid={`${testIdPrefix}-${index}`}
              >
                <Box component="span" sx={{ fontFamily: "monospace" }}>
                  {label}
                </Box>
              </Chip>
            );
          }
          return (
            <Button
              key={index}
              component={RouterLink}
              to="/tenants/$tenantId/agents/$agentId/traces/$traceId"
              params={{
                tenantId,
                agentId,
                traceId: traceNavigationRef.traceId,
              } as never}
              search={{ timestamp: traceNavigationRef.timestamp } as never}
              size="small"
              variant="text"
              endIcon={<IconMaterialSymbolsOpenInNew sx={{ fontSize: 14 }} />}
              data-testid={`${testIdPrefix}-${index}`}
              sx={{ fontFamily: "monospace" }}
            >
              {label}
            </Button>
          );
        })}
      </Box>
    </Box>
  );
}

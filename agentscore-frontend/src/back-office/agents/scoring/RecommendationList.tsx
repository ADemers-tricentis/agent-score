/** Recommendation cards + citation rendering (`improvement-advisor-usable`
 * spec, Proposal §2) — shared by `ImproveTab` (the Improve tab's latest set +
 * history detail) and `ScoringRunResultPage`'s "Advice for this run" block,
 * so both surfaces read one advisor run identically.
 *
 * Citation lookup joins `AdvisorRunOut.citationVerification` by
 * `recommendationIndex`, then matches a span citation by `spanId` and a
 * verdict-ref citation by `(interactionRef, evalSlug)`. A citation the model
 * cited but the group has no matching entry for renders as "unverified" —
 * never hidden, per the spec's "unverified citations are shown as such"
 * acceptance criterion.
 */
import type { ReactNode } from "react";
import Accordion from "@mui/material/Accordion";
import AccordionDetails from "@mui/material/AccordionDetails";
import AccordionSummary from "@mui/material/AccordionSummary";
import Link from "@mui/material/Link";
import IconMaterialSymbolsKeyboardArrowDown from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsKeyboardArrowDown.mjs";
import Alert from "@mui/material/Alert";
import AlertTitle from "@mui/material/AlertTitle";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { Link as RouterLink } from "@tanstack/react-router";
import IconMaterialSymbolsLightbulb from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsLightbulb.mjs";

import type {
  AdvisorCitationGroupOut,
  AdvisorCitationOut,
  AdvisorRecommendationOut,
  AdvisorRunOut,
} from "@/back-office/agents/scoring-api";
import { advisorStatusLabel } from "@/back-office/agents/scoring/advisor-status";
import { Chip } from "@/shared/components/chip";
import { EmptyState } from "@/shared/components/empty-state";

const PRIORITY_TINT = {
  high: "destructive",
  medium: "warning",
  low: "muted",
} as const;

// ---------------------------------------------------------------------------
// Citation lookup + chips
// ---------------------------------------------------------------------------

function citationGroupFor(
  citationVerification: AdvisorCitationGroupOut[] | undefined,
  index: number,
): AdvisorCitationGroupOut | undefined {
  return citationVerification?.find((g) => g.recommendationIndex === index);
}

function spanCitation(
  group: AdvisorCitationGroupOut | undefined,
  spanId: string,
): AdvisorCitationOut | undefined {
  return group?.citations.find((c: AdvisorCitationOut) => c.kind === "span" && c.spanId === spanId);
}

function verdictCitation(
  group: AdvisorCitationGroupOut | undefined,
  interactionRef: string,
  evalSlug: string,
): AdvisorCitationOut | undefined {
  return group?.citations.find(
    (c: AdvisorCitationOut) =>
      c.kind === "verdict_ref" &&
      c.interactionRef === interactionRef &&
      c.evalSlug === evalSlug,
  );
}

function VerificationChip({
  citation,
}: {
  citation: AdvisorCitationOut | undefined;
}) {
  if (!citation) return <Chip tint="muted">unverified</Chip>;
  if (citation.verified) return <Chip tint="success">verified</Chip>;
  if (citation.transcriptTruncated) {
    return <Chip tint="warning">unverified · transcript truncated</Chip>;
  }
  return <Chip tint="destructive">not found</Chip>;
}

// ---------------------------------------------------------------------------
// One recommendation
// ---------------------------------------------------------------------------

function RecommendationCard({
  recommendation,
  index,
  citationVerification,
  tenantId,
  agentId,
  scoringRunId,
}: {
  recommendation: AdvisorRecommendationOut;
  index: number;
  citationVerification: AdvisorCitationGroupOut[] | undefined;
  tenantId: string;
  agentId: string;
  scoringRunId: string | null;
}) {
  const group = citationGroupFor(citationVerification, index);
  const hasEvidence =
    recommendation.evidenceSpanIds.length > 0 ||
    recommendation.verdictRefs.length > 0;

  const citations = [
    ...recommendation.evidenceSpanIds.map((id: string) => spanCitation(group, id)),
    ...recommendation.verdictRefs.map((ref: { interactionRef: string; evalSlug: string }) => verdictCitation(group, ref.interactionRef, ref.evalSlug)),
  ];
  const unverifiedCount = citations.filter((citation) => !citation?.verified).length;

  return (
    <Card variant="outlined" data-testid={`advisor-recommendation-${index}`} sx={{ boxShadow: "none" }}>
      <CardContent sx={{ p: 3, "&:last-child": { pb: 3 } }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 2,
          }}
        >
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="overline" color="text.secondary">Recommendation {index + 1}</Typography>
            <Typography variant="h6" sx={{ overflowWrap: "anywhere" }}>{recommendation.title}</Typography>
          </Box>
          <Chip tint={PRIORITY_TINT[recommendation.priority as keyof typeof PRIORITY_TINT]}>
            {recommendation.priority} priority
          </Chip>
        </Box>
        <Typography variant="body1" sx={{ mt: 2, maxWidth: "85ch", lineHeight: 1.7, overflowWrap: "anywhere" }}>
          {recommendation.recommendation}
        </Typography>
        <Accordion disableGutters elevation={0} sx={{ mt: 2, backgroundColor: "transparent", "&:before": { display: "none" } }}>
          <AccordionSummary
            expandIcon={<IconMaterialSymbolsKeyboardArrowDown fontSize="small" />}
            data-testid={`advisor-evidence-toggle-${index}`}
            sx={{ px: 0 }}
          >
            <Box sx={{ display: "flex", gap: 1, alignItems: "center", flexWrap: "wrap" }}>
              <Typography variant="subtitle2">Why this helps{hasEvidence ? ` · ${citations.length} references` : ""}</Typography>
              {unverifiedCount > 0 ? <Chip tint="warning">{unverifiedCount} unverified</Chip> : null}
            </Box>
          </AccordionSummary>
          <AccordionDetails sx={{ px: 0, pb: 0 }}>
            <Typography variant="body2" color="text.secondary" sx={{ maxWidth: "85ch", lineHeight: 1.7, overflowWrap: "anywhere" }}>
              {recommendation.rationale}
            </Typography>
        {hasEvidence ? (
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" color="text.secondary">
              Evidence
            </Typography>
            <Stack
              sx={{ gap: 1.5, mt: 1 }}
            >
              {recommendation.evidenceSpanIds.map((spanId: string) => (
                <Box
                  key={spanId}
                  data-testid={`advisor-citation-span-${spanId}`}
                  sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap", overflowWrap: "anywhere" }}
                >
                  <Typography variant="caption" sx={{ fontFamily: "monospace" }}>
                    {spanId}
                  </Typography>
                  <VerificationChip citation={spanCitation(group, spanId)} />
                </Box>
              ))}
              {recommendation.verdictRefs.map((ref: { interactionRef: string; evalSlug: string }) => {
                const label = `${ref.interactionRef} · ${ref.evalSlug}`;
                const link: ReactNode = scoringRunId ? (
                  <Link component={RouterLink} underline="hover"
                    to={`/tenants/${tenantId}/agents/${agentId}/runs/${scoringRunId}`}
                  >
                    <Typography variant="caption">{label}</Typography>
                  </Link>
                ) : (
                  <Typography variant="caption">{label}</Typography>
                );
                return (
                  <Box
                    key={`${ref.interactionRef}:${ref.evalSlug}`}
                    data-testid={`advisor-citation-verdict-${ref.interactionRef}-${ref.evalSlug}`}
                    sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap", overflowWrap: "anywhere" }}
                  >
                    {link}
                    <VerificationChip
                      citation={verdictCitation(
                        group,
                        ref.interactionRef,
                        ref.evalSlug,
                      )}
                    />
                  </Box>
                );
              })}
            </Stack>
          </Box>
        ) : null}
          </AccordionDetails>
        </Accordion>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Non-succeeded status + basis line
// ---------------------------------------------------------------------------

function StatusAlert({ run }: { run: AdvisorRunOut }) {
  return (
    <Alert
      severity={run.status === "failed" ? "error" : "warning"}
      data-testid="advisor-status"
    >
      <AlertTitle>{advisorStatusLabel(run.status)}</AlertTitle>
      {run.status === "failed" && run.errorCode
        ? `Error: ${run.errorCode}`
        : null}
      {run.status === "bounds_exhausted" && run.boundExhausted
        ? `Limit reached: ${run.boundExhausted}`
        : null}
    </Alert>
  );
}

export function AdviceBasis({
  run,
  tenantId,
  agentId,
  showSourceLink = true,
}: {
  showSourceLink?: boolean;
  run: AdvisorRunOut;
  tenantId: string;
  agentId: string;
}) {
  const basis = run.basis;
  if (!basis) return null;
  return (
    <Typography
      variant="caption"
      color="text.secondary"
      data-testid="advisor-basis"
      title={`Advisor version ${run.agentVersionId}`}
    >
      Based on {basis.verdictsSelected} of {basis.verdictCount} verdicts
      {showSourceLink ? <> · <Link component={RouterLink} underline="hover"
        to={`/tenants/${tenantId}/agents/${agentId}/runs/${basis.scoringRunId}`}
      >
        View scoring run
      </Link></> : null}
      {basis.verdictsTruncated ? " · evidence truncated" : ""}
      {basis.promptClippedSections && basis.promptClippedSections.length > 0
        ? ` · clipped: ${basis.promptClippedSections.join(", ")}`
        : ""}
    </Typography>
  );
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

export function RecommendationList({
  run,
  tenantId,
  agentId,
  showBasis = true,
}: {
  showBasis?: boolean;
  run: AdvisorRunOut;
  tenantId: string;
  agentId: string;
}) {
  const recommendations = run.recommendations ?? [];

  return (
    <Stack spacing={3} sx={{ maxWidth: 1024, width: "100%" }} data-testid="advisor-recommendation-list">
      {showBasis ? <AdviceBasis run={run} tenantId={tenantId} agentId={agentId} /> : null}
      {run.status !== "succeeded" ? (
        <StatusAlert run={run} />
      ) : recommendations.length === 0 ? (
        <EmptyState
          icon={IconMaterialSymbolsLightbulb}
          title="No recommendations"
          description={
            run.insufficientEvidenceReason ??
            "The advisor found no actionable recommendations for this run."
          }
          testId="advisor-no-recommendations"
        />
      ) : (
        recommendations.map((recommendation: AdvisorRecommendationOut, index: number) => (
          <RecommendationCard
            key={index}
            recommendation={recommendation}
            index={index}
            citationVerification={run.citationVerification}
            tenantId={tenantId}
            agentId={agentId}
            scoringRunId={run.scoringRunId}
          />
        ))
      )}
    </Stack>
  );
}

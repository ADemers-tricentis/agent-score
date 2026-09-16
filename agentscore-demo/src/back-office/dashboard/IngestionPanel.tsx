/** IngestionPanel — ingestion-health card. No backend: reads straight off
 * the fixture `IngestionOverview` + `deriveIngestionHealth`. This clone
 * doesn't build the ingestion admin page, so unlike the real panel there's
 * no "View ingestion →" link out.
 *
 * Drop/noise rate is intentionally omitted — see the real panel's note on
 * why that metric is misleading.
 */

import type { ReactNode } from "react";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";

import { fmtCount, fmtPercent1 } from "@/back-office/dashboard/format";
import type { IngestionOverview } from "@/back-office/dashboard/fake-data";
import { deriveIngestionHealth } from "@/back-office/dashboard/ingestion-health";
import { StatusDot } from "@/shared/components/status-dot";

interface IngestionPanelProps {
  ingestion: IngestionOverview;
}

function HealthRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        py: 1.125,
        borderBottom: 1,
        borderColor: "divider",
        typography: "body2",
        "&:last-of-type": { borderBottom: "none" },
      }}
    >
      <Box component="span" sx={{ color: "text.secondary" }}>
        {label}
      </Box>
      <Box component="span" sx={{ fontWeight: 600 }}>
        {value}
      </Box>
    </Box>
  );
}

export function IngestionPanel({ ingestion }: IngestionPanelProps) {
  const health = deriveIngestionHealth(ingestion);

  return (
    <Card sx={{ height: "100%" }}>
      <CardContent sx={{ p: 0, "&:last-child": { pb: 0 } }}>
        <Box sx={{ px: 2.5, py: 1.5 }}>
          <Box sx={{ typography: "body2", fontWeight: 600 }}>Ingestion health</Box>
          <Box sx={{ typography: "caption", color: "text.secondary" }}>Both OTLP points · live</Box>
        </Box>

        <Box sx={{ px: 2.5, pb: 2.5 }}>
          <HealthRow
            label="Current throughput"
            value={
              <Box component="span">
                {fmtCount(ingestion.currentTps)}{" "}
                <Box component="span" sx={{ color: "text.secondary", fontWeight: 400 }}>
                  traces/s
                </Box>
              </Box>
            }
          />
          <HealthRow label="Traces today" value={fmtCount(ingestion.tracesToday)} />
          <HealthRow
            label="Write success"
            value={
              <Box component="span" sx={{ color: "success.main" }}>
                {fmtPercent1(ingestion.writeSuccessRate)}
              </Box>
            }
          />
          <HealthRow
            label="Error rate"
            value={
              <Box component="span" sx={{ color: ingestion.errorRate > 0 ? "warning.main" : "success.main" }}>
                {fmtPercent1(ingestion.errorRate)}
              </Box>
            }
          />
          <HealthRow label="In flight (now)" value={fmtCount(health.inFlight)} />
          <HealthRow
            label="Active alerts"
            value={
              health.activeAlertCount > 0 ? (
                <Chip size="small" color="error" label={`${health.activeAlertCount} open`} />
              ) : (
                fmtCount(health.activeAlertCount)
              )
            }
          />
          {health.disabledPoints.length > 0 ? (
            <Box sx={{ pt: 1.5 }}>
              {health.disabledPoints.map((p) => (
                <StatusDot key={p.point} status="muted">
                  {p.point} point disabled
                </StatusDot>
              ))}
            </Box>
          ) : null}
        </Box>
      </CardContent>
    </Card>
  );
}

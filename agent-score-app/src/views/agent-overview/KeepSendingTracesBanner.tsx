import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";

/**
 * Shown while an agent is below the readiness threshold (REQ-065/068).
 * Lets a domain expert manually push mock traces so scoring unlocks live.
 */
export default function KeepSendingTracesBanner({
  captured,
  threshold,
  onSimulate,
}: {
  captured: number;
  threshold: number;
  onSimulate: () => void;
}) {
  return (
    <Alert
      severity="info"
      sx={{ borderRadius: 1.5 }}
      action={
        <Button size="small" color="info" variant="outlined" onClick={onSimulate} sx={{ whiteSpace: "nowrap", fontSize: "0.72rem" }}>
          Simulate traces
        </Button>
      }
    >
      <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.25 }}>
        Keep sending traces
      </Typography>
      <Typography variant="caption">
        Scoring unlocks automatically at {threshold} traces. You have {captured}/{threshold} traces so far - keep running your
        agent and we'll take care of the rest.
      </Typography>
    </Alert>
  );
}

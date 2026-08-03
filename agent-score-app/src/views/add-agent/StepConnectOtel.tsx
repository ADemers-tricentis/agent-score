import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Divider from "@mui/material/Divider";

// Demo-only values — this step is purely informational, there is no real
// OTel collector behind these endpoints/keys.
const API_KEY = "as_live_7f3d9a2e1b6c4f80a5d2e9c1b3a7f6d4";
const OTLP_ENDPOINT = "https://ingest.agentscore.io/otel/v1/traces";

const ENV_VARS = [
  { name: "OTEL_EXPORTER_OTLP_ENDPOINT", value: OTLP_ENDPOINT },
  { name: "OTEL_EXPORTER_OTLP_HEADERS", value: `api-key=${API_KEY}` },
  { name: "OTEL_SERVICE_NAME", value: "your-agent-service-name" },
];

const PYTHON_SNIPPET = `from opentelemetry import trace
from opentelemetry.exporter.otlp.proto.http.trace_exporter import OTLPSpanExporter
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor

provider = TracerProvider()
provider.add_span_processor(
    BatchSpanProcessor(OTLPSpanExporter())  # reads OTEL_EXPORTER_OTLP_* env vars
)
trace.set_tracer_provider(provider)

tracer = trace.get_tracer("your-agent-service-name")
with tracer.start_as_current_span("agent_run"):
    ...  # your agent's logic
`;

function CodeBlock({ children }: { children: string }) {
  return (
    <Box
      component="pre"
      sx={{
        m: 0,
        p: 1.5,
        borderRadius: 1.5,
        bgcolor: "action.hover",
        border: "1px solid",
        borderColor: "divider",
        fontFamily: "monospace",
        fontSize: "0.78rem",
        overflowX: "auto",
        whiteSpace: "pre",
      }}
    >
      {children}
    </Box>
  );
}

/**
 * Step 2 of the Add Agent wizard: static/mock display of how to wire up
 * OTel export for this agent. No real connection is made here — "Next" is
 * always enabled.
 */
export default function StepConnectOtel() {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <Typography variant="body2" sx={{ color: "text.secondary" }}>
        Point your agent's OpenTelemetry exporter at AgentScore using the credentials below. Traces sent to this
        endpoint will show up in the next step.
      </Typography>

      <Paper sx={{ p: 2.5, border: "1px solid", borderColor: "divider", borderRadius: 2 }}>
        <Typography variant="overline" sx={{ color: "text.disabled", fontSize: "0.62rem", letterSpacing: 1 }}>
          API key
        </Typography>
        <CodeBlock>{API_KEY}</CodeBlock>

        <Typography variant="overline" sx={{ color: "text.disabled", fontSize: "0.62rem", letterSpacing: 1, display: "block", mt: 2 }}>
          OTLP ingestion endpoint
        </Typography>
        <CodeBlock>{OTLP_ENDPOINT}</CodeBlock>

        <Divider sx={{ my: 2 }} />

        <Typography variant="overline" sx={{ color: "text.disabled", fontSize: "0.62rem", letterSpacing: 1 }}>
          Environment variables
        </Typography>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1, mt: 1 }}>
          {ENV_VARS.map((v) => (
            <CodeBlock key={v.name}>{`${v.name}=${v.value}`}</CodeBlock>
          ))}
        </Box>
      </Paper>

      <Paper sx={{ p: 2.5, border: "1px solid", borderColor: "divider", borderRadius: 2 }}>
        <Typography variant="overline" sx={{ color: "text.disabled", fontSize: "0.62rem", letterSpacing: 1 }}>
          Python setup
        </Typography>
        <Box sx={{ mt: 1 }}>
          <CodeBlock>{PYTHON_SNIPPET}</CodeBlock>
        </Box>
      </Paper>
    </Box>
  );
}

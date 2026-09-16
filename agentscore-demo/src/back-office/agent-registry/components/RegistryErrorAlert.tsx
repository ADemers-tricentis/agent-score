/** The single surface every agent-registry mutation refusal lands on (spec
 *  S14a §1 "nothing is swallowed"). Shows the server's own message, the
 *  plain-language explanation for a known code, and the machine code itself —
 *  never invents text and never replaces what the server said.
 */

import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";

import { explainRegistryError } from "@/back-office/agent-registry/registry-errors";
import { detailCode, detailMessage } from "@/shared/api/errors";

interface RegistryErrorAlertProps {
  error: unknown;
  fallback?: string;
}

export function RegistryErrorAlert({ error, fallback }: RegistryErrorAlertProps) {
  if (error == null) return null;

  const code = detailCode(error);
  const thrownMessage = error instanceof Error && error.message.trim() ? error.message : null;
  const message = detailMessage(error) ?? thrownMessage ?? fallback ?? "Something went wrong.";
  const explanation = code ? explainRegistryError(code) : null;

  return (
    <Alert severity="error" data-testid="registry-error">
      <Box sx={{ typography: "body2" }}>{message}</Box>
      {explanation ? (
        <Box sx={{ typography: "body2", color: "text.secondary", mt: 0.5 }}>
          {explanation}
        </Box>
      ) : null}
      {code ? (
        <Box
          component="code"
          sx={{
            display: "block",
            mt: 0.5,
            fontFamily: "monospace",
            typography: "caption",
            color: "text.secondary",
          }}
        >
          {code}
        </Box>
      ) : null}
    </Alert>
  );
}

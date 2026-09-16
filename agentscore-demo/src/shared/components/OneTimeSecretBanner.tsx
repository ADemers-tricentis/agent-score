import { useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import { alpha } from "@mui/material/styles";
import IconMaterialSymbolsCheck from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsCheck.mjs";
import IconMaterialSymbolsClose from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsClose.mjs";
import IconMaterialSymbolsContentCopy from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsContentCopy.mjs";
import IconMaterialSymbolsKey from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsKey.mjs";

interface OneTimeSecretBannerProps {
  /** The raw secret value (shown once). Never re-fetchable. */
  secret: string;
  /** Heading text (e.g. "Project API key — copy now"). */
  title: string;
  /** Sub-line — explain that it's one-time and where to store it. */
  description: string;
  /** Test id hook; defaults to "one-time-secret-banner". */
  testId?: string;
  /** Optional dismiss callback; if provided, an X button is shown. */
  onDismiss?: () => void;
}

/**
 * Renders a one-time secret reveal pane. The value is held only in
 * component-local state by callers — never persisted, never cached in
 * react-query, never re-fetchable. Modeled on Stripe's API-key reveal:
 * green banner, copy button, dismissible, mono-spaced value.
 *
 * Visual contract: the testId attribute on the root makes "did we render
 * the banner" assertable without grepping styling classes; the copy button
 * carries `aria-label="Copy secret"` so a screen-reader user can find it
 * by name.
 *
 * Two constraints bind the palette here, and both must hold:
 *  - Stock tokens only (`success`, `text`, `background`). This component has a
 *    bare-`render()` test with no AppThemeProvider, so every token it names
 *    must also exist on the MUI default theme — `palette.Alert.*` does not.
 *  - Text pairs must clear WCAG AA (4.5:1). The green-on-green pairing this
 *    replaced (`success.dark` on `success.light`) was 2.4:1, unreadable for
 *    the one value the user gets exactly one chance to copy. The fill is a
 *    10% `success.main` tint (the tinted-callout convention shared with
 *    `access-denied` / `cascade-preview-list`) with `text.primary` on top.
 */
export function OneTimeSecretBanner({
  secret,
  title,
  description,
  testId = "one-time-secret-banner",
  onDismiss,
}: OneTimeSecretBannerProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(secret);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API can refuse (insecure context, permission denied).
      // The user can still select+copy the value manually, so we just
      // skip the success indicator.
    }
  };

  return (
    <Box
      data-testid={testId}
      role="alert"
      sx={(theme) => ({
        borderRadius: 1,
        border: 1,
        borderColor: theme.palette.success.main,
        bgcolor: alpha(theme.palette.success.main, 0.1),
        p: 2,
      })}
    >
      <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5 }}>
        <IconMaterialSymbolsKey
          sx={(theme) => ({
            mt: 0.25,
            fontSize: 20,
            flexShrink: 0,
            color: theme.palette.success.dark,
          })}
        />
        <Box sx={{ flex: 1, display: "flex", flexDirection: "column", gap: 1 }}>
          <Box
            sx={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              gap: 1,
            }}
          >
            <Box>
              <Box
                sx={(theme) => ({
                  fontWeight: 600,
                  color: theme.palette.text.primary,
                })}
              >
                {title}
              </Box>
              <Box
                sx={(theme) => ({
                  typography: "body1",
                  color: theme.palette.text.primary,
                })}
              >
                {description}
              </Box>
            </Box>
            {onDismiss && (
              <IconButton
                color="success"
                size="small"
                aria-label="Dismiss"
                data-testid="dismiss-secret"
                onClick={onDismiss}
              >
                <IconMaterialSymbolsClose sx={{ fontSize: 16 }} />
              </IconButton>
            )}
          </Box>
          <Box
            sx={(theme) => ({
              display: "flex",
              alignItems: "center",
              gap: 1,
              borderRadius: 1,
              border: 1,
              borderColor: theme.palette.success.main,
              bgcolor: theme.palette.background.paper,
              px: 1.5,
              py: 1,
            })}
          >
            <Box
              component="code"
              data-testid={`${testId}-value`}
              sx={{
                flex: 1,
                wordBreak: "break-all",
                fontFamily: "monospace",
                typography: "body1",
              }}
            >
              {secret}
            </Box>
            <Button
              type="button"
              variant="outlined"
              size="small"
              color="success"
              aria-label="Copy secret"
              onClick={() => void handleCopy()}
              startIcon={
                copied ? (
                  <IconMaterialSymbolsCheck sx={{ fontSize: 14 }} />
                ) : (
                  <IconMaterialSymbolsContentCopy sx={{ fontSize: 14 }} />
                )
              }
            >
              {copied ? "Copied" : "Copy"}
            </Button>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

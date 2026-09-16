import { useEffect, useRef, useState, type ReactNode } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import IconMaterialSymbolsCheck from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsCheck.mjs";
import IconMaterialSymbolsContentCopy from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsContentCopy.mjs";

import { toast } from "@/shared/lib/toast";

interface CodeBlockProps {
  /** Code text. Whitespace preserved. */
  children: string;
  /** Optional eyebrow label rendered above the block. */
  label?: ReactNode;
  /** Dark terminal style. Default true (matches the design ref). */
  dark?: boolean;
  /** Single-line / no-wrap block (e.g. API key reveal). */
  inline?: boolean;
  /** Override the Copy button label. */
  copyLabel?: ReactNode;
  /**
   * Stable hook for the copy `<button>` — `data-testid={testId}` (Button
   * forwards to root). `data-slot="code-block"` alone can't disambiguate two
   * `CodeBlock`s on the same screen (e.g. an endpoint block next to an
   * exporter block), since it sits on the shared root.
   */
  testId?: string;
  className?: string;
}

/**
 * Mono code block with one-click copy. Default style is dark + mono — used
 * for env-var snippets, integration guides, and the API key reveal dialog.
 */
export function CodeBlock({
  children,
  label,
  dark = true,
  inline = false,
  copyLabel,
  testId,
  className,
}: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    return () => clearTimeout(timeoutRef.current);
  }, []);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(children);
      clearTimeout(timeoutRef.current);
      setCopied(true);
      timeoutRef.current = setTimeout(() => setCopied(false), 1500);
    } catch {
      clearTimeout(timeoutRef.current);
      setCopied(false);
      toast.error("Could not copy text. Check clipboard permissions and try again.");
    }
  };

  return (
    <Box
      data-slot="code-block"
      className={className}
      sx={{ display: "flex", flexDirection: "column", gap: 0.75 }}
    >
      {label ? (
        <Box
          sx={{
            typography: "overline",
            color: "text.secondary",
          }}
        >
          {label}
        </Box>
      ) : null}
      <Box sx={{ display: "flex", alignItems: "stretch", gap: 1 }}>
        <Box
          component="pre"
          sx={(theme) => ({
            flex: 1,
            overflowX: "auto",
            borderRadius: 1,
            p: 1.5,
            fontFamily: "monospace",
            typography: "caption",
            m: 0,
            whiteSpace: inline ? "nowrap" : "pre-wrap",
            ...(dark
              ? {
                  bgcolor: theme.palette.grey[900],
                  color: theme.palette.grey[100],
                }
              : {
                  border: 1,
                  borderColor: "divider",
                  bgcolor: "action.hover",
                  color: "text.primary",
                }),
          })}
        >
          {children}
        </Box>
        <Button
          type="button"
          variant="outlined"
          size="small"
          onClick={() => void copy()}
          aria-label="Copy to clipboard"
          data-testid={testId}
          startIcon={
            copied ? (
              <IconMaterialSymbolsCheck sx={{ fontSize: 14 }} />
            ) : (
              <IconMaterialSymbolsContentCopy sx={{ fontSize: 14 }} />
            )
          }
        >
          {copyLabel ?? (copied ? "Copied" : "Copy")}
        </Button>
      </Box>
    </Box>
  );
}

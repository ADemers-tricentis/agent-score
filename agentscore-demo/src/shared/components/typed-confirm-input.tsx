import { useId, useState, type ReactNode } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import FormLabel from "@mui/material/FormLabel";
import TextField from "@mui/material/TextField";

interface TypedConfirmInputProps {
  /**
   * The exact string the user must type before the destructive action enables.
   * Comparison is case-sensitive by default.
   */
  confirmText: string;
  /** Whether the comparison is case-sensitive. Default `true`. */
  caseSensitive?: boolean;
  /** Label for the input. Default reads `Type <confirmText> to confirm`. */
  label?: ReactNode;
  /** Text on the destructive action button. */
  buttonLabel: ReactNode;
  /** Fired when the user clicks the action with a matching input. */
  onConfirm: () => void;
  /** Pass-through busy state — disables the button + reads as "in flight". */
  busy?: boolean;
  /**
   * Optional stable hook. When set, the input gets `data-testid="<testId>-input"`
   * and the confirm button `data-testid="<testId>-confirm"` (for e2e/regression).
   */
  testId?: string;
  /** Block confirmation for a reason other than an in-flight action — e.g. the
   *  blast radius the button names is not known yet. Distinct from `busy`
   *  because it is not a transient "working" state and may never resolve. */
  disabled?: boolean;
  className?: string;
}

/**
 * Typed-confirmation pattern for destructive cascades (hard-purge, etc.).
 * The destructive button stays disabled until the user types the exact
 * `confirmText` (e.g. the tenant name).
 */
export function TypedConfirmInput({
  confirmText,
  caseSensitive = true,
  label,
  buttonLabel,
  onConfirm,
  busy,
  testId,
  disabled,
  className,
}: TypedConfirmInputProps) {
  const inputId = useId();
  const [value, setValue] = useState("");

  const matches = caseSensitive
    ? value === confirmText
    : value.toLowerCase() === confirmText.toLowerCase();

  const labelNode = label ?? (
    <>
      Type{" "}
      <Box
        component="span"
        sx={{
          borderRadius: 0.5,
          bgcolor: "action.hover",
          px: 0.5,
          fontFamily: "monospace",
          typography: "caption",
        }}
      >
        {confirmText}
      </Box>{" "}
      to confirm
    </>
  );

  return (
    <Box
      data-slot="typed-confirm"
      data-matches={matches ? "true" : "false"}
      className={className}
      sx={{ display: "flex", flexDirection: "column", gap: 1 }}
    >
      <FormLabel
        htmlFor={inputId}
        sx={{ typography: "subtitle2", lineHeight: 1.625 }}
      >
        {labelNode}
      </FormLabel>
      <TextField
        slotProps={{
          htmlInput: {
            id: inputId,
            "data-slot": "typed-confirm-input",
            "data-testid": testId ? `${testId}-input` : undefined,
            autoComplete: "off",
            spellCheck: false,
          },
        }}
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder={confirmText}
      />
      <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
        <Button
          data-slot="typed-confirm-button"
          data-testid={testId ? `${testId}-confirm` : undefined}
          type="button"
          variant="contained"
          color="error"
          disableElevation
          disabled={!matches || busy || disabled}
          onClick={() => {
            if (matches && !busy && !disabled) onConfirm();
          }}
        >
          {buttonLabel}
        </Button>
      </Box>
    </Box>
  );
}

import { forwardRef, useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import TextField from "@mui/material/TextField";
import IconMaterialSymbolsCasino from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsCasino.mjs";
import IconMaterialSymbolsVisibility from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsVisibility.mjs";
import IconMaterialSymbolsVisibilityOff from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsVisibilityOff.mjs";

interface PasswordInputProps
  extends Omit<React.ComponentProps<"input">, "type" | "size"> {
  /** Render a "Generate" button that fills a strong random password. */
  showGenerate?: boolean;
  /** Render the field as plain text and hide the visibility toggle. Used on
   * the "Add user" screen where the admin sets a one-time password they need
   * to share with the user out-of-band. */
  alwaysVisible?: boolean;
  /** Length used by the Generate button. Default 16. */
  generateLength?: number;
  /** Called with the generated password — wire to `setState` to fill the input. */
  onGenerate?: (password: string) => void;
}

const PASSWORD_ALPHA =
  "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*-_";

function generatePassword(length: number): string {
  const buf = new Uint8Array(length);
  crypto.getRandomValues(buf);
  let out = "";
  for (let i = 0; i < length; i++) out += PASSWORD_ALPHA[buf[i] % PASSWORD_ALPHA.length];
  return out;
}

/**
 * Password text field with optional visibility toggle and a "Generate"
 * helper. Built on the MUI `TextField` + `Button`/`IconButton` primitives.
 *
 * F2: `id` and any `data-*` attributes the caller passes are routed to the
 * editable `<input>` leaf via `slotProps.htmlInput` (MUI puts a bare `id` on
 * the wrapper, but `#new-user-password` is an e2e selector). Remaining standard
 * input props pass straight through as `TextField` props.
 */
export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  function PasswordInput(
    {
      showGenerate = false,
      alwaysVisible = false,
      generateLength = 16,
      onGenerate,
      className,
      id,
      ...rest
    },
    ref,
  ) {
    const [visible, setVisible] = useState(false);
    const effectiveType = alwaysVisible || visible ? "text" : "password";

    const dataAttrs: Record<string, unknown> = {};
    const fieldProps: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(rest)) {
      if (key.startsWith("data-")) dataAttrs[key] = value;
      else fieldProps[key] = value;
    }
    const htmlInput = { ...dataAttrs, ...(id ? { id } : {}) };

    return (
      <Box
        data-slot="password-input"
        className={className}
        sx={{ display: "flex", alignItems: "center", gap: 1 }}
      >
        <TextField
          {...fieldProps}
          inputRef={ref}
          type={effectiveType}
          sx={{ flex: 1, "& input": { fontFamily: "monospace" } }}
          slotProps={{
            htmlInput,
            input: alwaysVisible
              ? undefined
              : {
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        type="button"
                        tabIndex={-1}
                        edge="end"
                        size="small"
                        aria-label={visible ? "Hide password" : "Show password"}
                        onClick={() => setVisible((v) => !v)}
                      >
                        {visible ? (
                          <IconMaterialSymbolsVisibilityOff fontSize="small" />
                        ) : (
                          <IconMaterialSymbolsVisibility fontSize="small" />
                        )}
                      </IconButton>
                    </InputAdornment>
                  ),
                },
          }}
        />
        {showGenerate ? (
          <Button
            type="button"
            variant="outlined"
            size="small"
            startIcon={<IconMaterialSymbolsCasino fontSize="small" />}
            onClick={() => onGenerate?.(generatePassword(generateLength))}
          >
            Generate
          </Button>
        ) : null}
      </Box>
    );
  },
);

import { useState } from "react";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";

interface TypedConfirmInputProps {
  confirmText: string;
  buttonLabel: string;
  busy?: boolean;
  testId?: string;
  onConfirm: () => void;
}

export default function TypedConfirmInput({ confirmText, buttonLabel, busy = false, testId, onConfirm }: TypedConfirmInputProps) {
  const [value, setValue] = useState("");
  const matches = value === confirmText;

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
      <Typography variant="caption" sx={{ color: "text.secondary" }}>
        Type <strong>{confirmText}</strong> to confirm.
      </Typography>
      <TextField
        size="small"
        fullWidth
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={confirmText}
      />
      <Button
        variant="contained"
        color="error"
        disabled={!matches || busy}
        onClick={onConfirm}
        data-testid={testId}
        sx={{ alignSelf: "flex-start" }}
      >
        {busy ? "Working…" : buttonLabel}
      </Button>
    </Box>
  );
}

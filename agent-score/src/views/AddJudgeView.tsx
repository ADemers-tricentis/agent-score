import { useState } from "react";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import ButtonBase from "@mui/material/ButtonBase";
import TextField from "@mui/material/TextField";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import InputAdornment from "@mui/material/InputAdornment";
import IconButton from "@mui/material/IconButton";
import Alert from "@mui/material/Alert";
import Divider from "@mui/material/Divider";
import ChipStatus from "@tricentis/aura/components/ChipStatus.js";
import type { View, LLMProvider } from "../types";

interface Props {
  navigate: (v: View) => void;
}

const PROVIDER_MODELS: Record<LLMProvider, string[]> = {
  Anthropic: [
    "claude-sonnet-4-6",
    "claude-opus-4-8",
    "claude-haiku-4-5-20251001",
  ],
  "AWS Bedrock": [
    "us.anthropic.claude-sonnet-4-6",
    "us.anthropic.claude-opus-4-8",
    "us.anthropic.claude-haiku-4-5-20251001",
  ],
  "OpenAI-compatible": [
    "gpt-4o",
    "gpt-4o-mini",
    "gpt-4-turbo",
  ],
};

type ConnectionState = "idle" | "testing" | "ok" | "error";

function SectionRow({
  title,
  description,
  children,
  last,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
  last?: boolean;
}) {
  return (
    <>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "240px 1fr",
          gap: 4,
          py: 4,
          alignItems: "start",
        }}
      >
        <Box>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>
            {title}
          </Typography>
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            {description}
          </Typography>
        </Box>
        <Paper
          sx={{
            p: 3,
            border: "1px solid",
            borderColor: "divider",
            borderRadius: 2,
          }}
        >
          {children}
        </Paper>
      </Box>
      {!last && <Divider />}
    </>
  );
}

export default function AddJudgeView({ navigate }: Props) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [provider, setProvider] = useState<LLMProvider>("Anthropic");
  const [model, setModel] = useState("claude-sonnet-4-6");
  const [apiKey, setApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [connection, setConnection] = useState<ConnectionState>("idle");
  const [submitted, setSubmitted] = useState(false);

  const nameError = submitted && !name.trim();
  const modelError = submitted && !model.trim();
  const keyError = submitted && !apiKey.trim();

  function handleProviderChange(p: LLMProvider) {
    setProvider(p);
    setModel(PROVIDER_MODELS[p][0]);
  }

  function handleTestConnection() {
    if (!apiKey.trim()) return;
    setConnection("testing");
    setTimeout(() => {
      setConnection(apiKey.startsWith("sk-") || apiKey.startsWith("AKIA") ? "ok" : "error");
    }, 1200);
  }

  function handleSubmit() {
    setSubmitted(true);
    if (!name.trim() || !model.trim() || !apiKey.trim()) return;
    navigate({ name: "llm-judges" });
  }

  return (
    <Box sx={{ p: 3, maxWidth: 860 }}>
      {/* Back nav */}
      <ButtonBase
        onClick={() => navigate({ name: "llm-judges" })}
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 0.5,
          mb: 3,
          color: "text.secondary",
          typography: "body2",
          borderRadius: 1,
          px: 0.5,
          "&:hover": { color: "text.primary" },
        }}
      >
        ← LLM Judges
      </ButtonBase>

      <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>
        Add judge
      </Typography>
      <Typography variant="body2" sx={{ color: "text.secondary", mb: 0 }}>
        Registers a named LLM judge in the global catalog. The API key is stored encrypted and never returned.
      </Typography>

      <Divider sx={{ my: 3 }} />

      {/* General */}
      <SectionRow
        title="General"
        description="Name is the human identifier — unique across live judges."
      >
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <TextField
            label={<>Name <Typography component="span" sx={{ color: "error.main", fontSize: "inherit" }}>*</Typography></>}
            placeholder="e.g. Sonnet-strict"
            value={name}
            onChange={(e) => setName(e.target.value)}
            error={nameError}
            helperText={nameError ? "Name is required" : undefined}
            fullWidth
            size="small"
          />
          <TextField
            label="Description"
            placeholder="Optional — what this judge is for."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            multiline
            minRows={3}
            fullWidth
            size="small"
          />
        </Box>
      </SectionRow>

      {/* Provider & model */}
      <SectionRow
        title="Provider & model"
        description="The LLM that backs this judge. Discover models live, or type a model id manually."
      >
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <FormControl fullWidth size="small">
            <InputLabel>
              Provider{" "}
              <Typography component="span" sx={{ color: "error.main", fontSize: "inherit" }}>
                *
              </Typography>
            </InputLabel>
            <Select
              value={provider}
              label="Provider *"
              onChange={(e) => handleProviderChange(e.target.value as LLMProvider)}
            >
              {(["Anthropic", "AWS Bedrock", "OpenAI-compatible"] as LLMProvider[]).map((p) => (
                <MenuItem key={p} value={p}>{p}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth size="small" error={modelError}>
            <InputLabel>
              Model{" "}
              <Typography component="span" sx={{ color: "error.main", fontSize: "inherit" }}>
                *
              </Typography>
            </InputLabel>
            <Select
              value={model}
              label="Model *"
              onChange={(e) => setModel(e.target.value)}
              renderValue={(v) => (
                <Typography variant="body2" sx={{ fontFamily: "monospace" }}>{v}</Typography>
              )}
            >
              {PROVIDER_MODELS[provider].map((m) => (
                <MenuItem key={m} value={m}>
                  <Typography variant="body2" sx={{ fontFamily: "monospace" }}>{m}</Typography>
                </MenuItem>
              ))}
              <Divider />
              <MenuItem value="__custom__" disabled sx={{ fontSize: "0.8rem", color: "text.disabled" }}>
                Or type a model id manually…
              </MenuItem>
            </Select>
          </FormControl>

          {model === "__custom__" && (
            <TextField
              label="Model id"
              placeholder="e.g. anthropic.claude-3-5-sonnet-20241022-v2:0"
              fullWidth
              size="small"
              value=""
              onChange={(e) => setModel(e.target.value)}
              InputProps={{ sx: { fontFamily: "monospace" } }}
            />
          )}
        </Box>
      </SectionRow>

      {/* Credentials */}
      <SectionRow
        title="Credentials"
        description="The provider API key. Required on create, stored encrypted, never returned."
        last
      >
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <TextField
            label={<>API key <Typography component="span" sx={{ color: "error.main", fontSize: "inherit" }}>*</Typography></>}
            placeholder={provider === "AWS Bedrock" ? "AKIA…" : "sk-…"}
            value={apiKey}
            onChange={(e) => { setApiKey(e.target.value); setConnection("idle"); }}
            error={keyError}
            helperText={keyError ? "API key is required" : undefined}
            type={showKey ? "text" : "password"}
            fullWidth
            size="small"
            InputProps={{
              sx: { fontFamily: "monospace" },
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    size="small"
                    onClick={() => setShowKey((v) => !v)}
                    edge="end"
                    aria-label={showKey ? "Hide key" : "Show key"}
                  >
                    {showKey ? "🙈" : "👁"}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Button
              variant="outlined"
              size="small"
              disabled={!apiKey.trim() || connection === "testing"}
              onClick={handleTestConnection}
              sx={{ color: "text.secondary", borderColor: "divider" }}
            >
              {connection === "testing" ? "Testing…" : "⚡ Test connection"}
            </Button>
            {connection === "ok" && <ChipStatus status="Passed" />}
            {connection === "error" && <ChipStatus status="Failed" />}
          </Box>

          {connection === "error" && (
            <Alert severity="error" sx={{ py: 0.5 }}>
              Authentication failed. Check that the API key is valid and has access to the selected model.
            </Alert>
          )}

          <Typography variant="caption" sx={{ color: "text.disabled" }}>
            Optional check — verifies auth and that the selected model works. It does not block saving.
          </Typography>
        </Box>
      </SectionRow>

      {/* Footer */}
      <Divider sx={{ mb: 3 }} />
      <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1.5 }}>
        <Button variant="outlined" color="inherit" sx={{ color: "text.secondary" }} onClick={() => navigate({ name: "llm-judges" })}>
          Cancel
        </Button>
        <Button variant="contained" onClick={handleSubmit}>
          Add judge
        </Button>
      </Box>
    </Box>
  );
}

import { useState } from "react";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import SvgIcon from "@mui/material/SvgIcon";
import Tooltip from "@mui/material/Tooltip";

const COPY_ICON = "M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z";
const CHECK_ICON = "M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z";

interface CodeBlockProps {
  children: string;
  testId?: string;
}

export default function CodeBlock({ children, testId }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(children);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <Box
      data-testid={testId}
      sx={{
        position: "relative",
        bgcolor: "action.hover",
        borderRadius: 1,
        border: "1px solid",
        borderColor: "divider",
        p: 1.5,
        pr: 5,
      }}
    >
      <Box
        component="pre"
        sx={{ m: 0, fontFamily: "monospace", fontSize: "0.78rem", whiteSpace: "pre-wrap", wordBreak: "break-word" }}
      >
        {children}
      </Box>
      <Tooltip title={copied ? "Copied" : "Copy"}>
        <IconButton size="small" onClick={handleCopy} sx={{ position: "absolute", top: 6, right: 6 }}>
          <SvgIcon fontSize="small">
            <path d={copied ? CHECK_ICON : COPY_ICON} />
          </SvgIcon>
        </IconButton>
      </Tooltip>
    </Box>
  );
}

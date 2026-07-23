import { useState } from "react";
import type { ReactNode } from "react";
import Paper from "@mui/material/Paper";
import Dialog from "@mui/material/Dialog";
import IconButton from "@mui/material/IconButton";
import SvgIcon from "@mui/material/SvgIcon";

function CloseIcon() {
  return <SvgIcon sx={{ fontSize: 20 }}><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" /></SvgIcon>;
}

interface Props {
  cardContent: ReactNode;
  detailContent: ReactNode;
  testId?: string;
}

/** A catalog tile that expands into a centered modal detail panel on click —
 * the collapsed/expanded split used across the Dimensions and Profiles
 * catalogs (mirrors the CardGrid pattern in Tricentis-AI/agent-score). */
export default function ExpandableCard({ cardContent, detailContent, testId }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Paper
        variant="outlined"
        onClick={() => setOpen(true)}
        data-testid={testId}
        sx={{
          height: "100%",
          borderRadius: 2,
          cursor: "pointer",
          transition: "all 0.15s",
          "&:hover": { borderColor: "primary.main", bgcolor: "action.hover" },
        }}
      >
        {cardContent}
      </Paper>
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <IconButton
          onClick={() => setOpen(false)}
          sx={{ position: "absolute", top: 12, right: 12, color: "text.secondary" }}
        >
          <CloseIcon />
        </IconButton>
        {detailContent}
      </Dialog>
    </>
  );
}

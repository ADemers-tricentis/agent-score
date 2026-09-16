// TEMPORARY shell for this pass (Agents section only) — NOT a copy of the
// real `sidebar-shell.tsx`, which pulls in auth + tenants/users/assistant
// APIs we haven't built yet. Swap for the real cloned shell once the nav/
// shell gets its own pass.
import type { ReactNode } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { Link } from "@tanstack/react-router";

export function MinimalShell({ children }: { children: ReactNode }) {
  return (
    <Box sx={{ display: "flex", height: "100vh" }}>
      <Box
        sx={{
          width: 220,
          flexShrink: 0,
          borderRight: 1,
          borderColor: "divider",
          p: 2,
          display: "flex",
          flexDirection: "column",
          gap: 1,
        }}
      >
        <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
          AgentScore
        </Typography>
        <Link to="/" style={{ textDecoration: "none", color: "inherit" }}>
          <Typography variant="body2">Home</Typography>
        </Link>
        <Link to="/agents" search={{ view: "list", by: "tenant" }} style={{ textDecoration: "none", color: "inherit" }}>
          <Typography variant="body2">Agents</Typography>
        </Link>
        <Link to="/tenants" style={{ textDecoration: "none", color: "inherit" }}>
          <Typography variant="body2">Tenants</Typography>
        </Link>
        <Link to="/users" style={{ textDecoration: "none", color: "inherit" }}>
          <Typography variant="body2">Users</Typography>
        </Link>
        <Link to="/evals/catalog/evals" style={{ textDecoration: "none", color: "inherit" }}>
          <Typography variant="body2">Evals Catalog</Typography>
        </Link>
        <Link to="/llm-catalog" search={{ tab: "catalog" }} style={{ textDecoration: "none", color: "inherit" }}>
          <Typography variant="body2">LLM Catalog</Typography>
        </Link>
        <Link to="/agent-registry" search={{}} style={{ textDecoration: "none", color: "inherit" }}>
          <Typography variant="body2">Agent Registry</Typography>
        </Link>
        <Link to="/reports" search={{ tab: "usage" }} style={{ textDecoration: "none", color: "inherit" }}>
          <Typography variant="body2">Reports</Typography>
        </Link>
      </Box>
      <Box sx={{ flex: 1, overflow: "auto" }}>{children}</Box>
    </Box>
  );
}

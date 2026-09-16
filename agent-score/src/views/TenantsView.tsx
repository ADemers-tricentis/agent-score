import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import ChipStatus from "@tricentis/aura/components/ChipStatus.js";
import ChipSubtle from "@tricentis/aura/components/ChipSubtle.js";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import type { View } from "../types";
import { TENANTS, PROJECTS } from "../data/mock";

interface Props {
  navigate: (v: View) => void;
}

const PLAN_COLOR: Record<string, "default" | "primary" | "secondary"> = {
  Pilot: "default",
  Standard: "secondary",
  Enterprise: "primary",
};

export default function TenantsView({ navigate: _navigate }: Props) {
  return (
    <Box sx={{ p: 3, maxWidth: 900 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>
          Tenants
        </Typography>
        <Typography variant="body2" sx={{ color: "text.secondary", maxWidth: 560 }}>
          Every customer organization onboarded onto AgentScore, with the number of agents each has
          registered.
        </Typography>
      </Box>

      <Paper sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2, overflow: "hidden" }}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: "action.hover" }}>
              <TableCell sx={{ fontWeight: 600, color: "text.secondary" }}>Name</TableCell>
              <TableCell sx={{ fontWeight: 600, color: "text.secondary" }}>Slug</TableCell>
              <TableCell sx={{ fontWeight: 600, color: "text.secondary" }}>Agents</TableCell>
              <TableCell sx={{ fontWeight: 600, color: "text.secondary" }}>Plan</TableCell>
              <TableCell sx={{ fontWeight: 600, color: "text.secondary" }}>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {TENANTS.map((tenant) => {
              const agentCount = PROJECTS.filter((p) => p.tenantId === tenant.id).length;
              return (
                <TableRow key={tenant.id} sx={{ "&:last-child td": { borderBottom: 0 } }}>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {tenant.name}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption" sx={{ fontFamily: "monospace", color: "text.secondary" }}>
                      {tenant.slug}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {agentCount > 0 ? (
                      <Typography variant="body2">{agentCount}</Typography>
                    ) : (
                      <Typography variant="body2" sx={{ fontStyle: "italic", color: "text.disabled" }}>
                        No agents yet
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <ChipSubtle
                      label={tenant.plan}
                      color={PLAN_COLOR[tenant.plan]}
                      sx={{ fontSize: "0.7rem", fontWeight: 600 }}
                    />
                  </TableCell>
                  <TableCell>
                    <ChipStatus status={tenant.status === "active" ? "Active" : "Pending"} />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Paper>
    </Box>
  );
}

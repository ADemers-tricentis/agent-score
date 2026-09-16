import { useState } from "react";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import ChipSubtle from "@tricentis/aura/components/ChipSubtle.js";
import type { View } from "../types";
import { STAFF_USERS, TENANTS } from "../data/mock";

interface Props {
  navigate: (v: View) => void;
}

const ROLE_COLOR: Record<string, "default" | "primary" | "secondary"> = {
  admin: "primary",
  member: "default",
};

function tenantNames(tenantIds: string[]): string {
  return tenantIds
    .map((id) => TENANTS.find((t) => t.id === id)?.name ?? id)
    .join(", ");
}

export default function UsersView({ navigate: _navigate }: Props) {
  const [inviteOpen, setInviteOpen] = useState(false);

  return (
    <Box sx={{ p: 3, maxWidth: 900 }}>
      <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", mb: 3 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>
            Users
          </Typography>
          <Typography variant="body2" sx={{ color: "text.secondary", maxWidth: 560 }}>
            Staff accounts with access to the AgentScore back office, and which tenants each one
            can see.
          </Typography>
        </Box>
        <Button
          variant="contained"
          onClick={() => setInviteOpen(true)}
          sx={{ flexShrink: 0, ml: 2 }}
        >
          Invite user
        </Button>
      </Box>

      <Paper sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2, overflow: "hidden" }}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: "action.hover" }}>
              <TableCell sx={{ fontWeight: 600, color: "text.secondary" }}>Name</TableCell>
              <TableCell sx={{ fontWeight: 600, color: "text.secondary" }}>Email</TableCell>
              <TableCell sx={{ fontWeight: 600, color: "text.secondary" }}>Role</TableCell>
              <TableCell sx={{ fontWeight: 600, color: "text.secondary" }}>Tenant access</TableCell>
              <TableCell sx={{ fontWeight: 600, color: "text.secondary" }}>Last active</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {STAFF_USERS.map((user) => (
              <TableRow key={user.id} sx={{ "&:last-child td": { borderBottom: 0 } }}>
                <TableCell>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {user.name}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="caption" sx={{ color: "text.secondary" }}>
                    {user.email}
                  </Typography>
                </TableCell>
                <TableCell>
                  <ChipSubtle
                    label={user.role === "admin" ? "Admin" : "Member"}
                    color={ROLE_COLOR[user.role]}
                    sx={{ fontSize: "0.7rem", fontWeight: 600 }}
                  />
                </TableCell>
                <TableCell>
                  <Typography variant="caption" sx={{ color: "text.secondary" }}>
                    {tenantNames(user.tenantIds)}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="caption" sx={{ color: "text.disabled" }}>
                    {user.lastActive}
                  </Typography>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>

      {/* Invite user dialog — visual affordance only, no real invite flow */}
      <Dialog open={inviteOpen} onClose={() => setInviteOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Invite user</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ color: "text.secondary", mb: 2 }}>
            Send an invite to a new staff account. This is a demo placeholder - no invite is
            actually sent.
          </Typography>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <TextField label="Email address" placeholder="name@tricentis.com" fullWidth size="small" />
            <FormControl fullWidth size="small">
              <InputLabel id="invite-role-label">Role</InputLabel>
              <Select labelId="invite-role-label" label="Role" defaultValue="member">
                <MenuItem value="admin">Admin</MenuItem>
                <MenuItem value="member">Member</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth size="small">
              <InputLabel id="invite-tenant-label">Tenant access</InputLabel>
              <Select labelId="invite-tenant-label" label="Tenant access" defaultValue={TENANTS[0]?.id ?? ""}>
                {TENANTS.map((tenant) => (
                  <MenuItem key={tenant.id} value={tenant.id}>
                    {tenant.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setInviteOpen(false)} color="inherit" sx={{ color: "text.secondary" }}>
            Cancel
          </Button>
          <Button variant="contained" onClick={() => setInviteOpen(false)}>
            Send invite
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

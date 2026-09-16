import { useState } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Button from "@mui/material/Button";
import type { View } from "../types";
import { TENANTS, approveAccessRequest, createStaffUser } from "../data/mock";
import EntityShell from "../components/EntityShell";
import FormSection from "../components/FormSection";
import { useToast } from "../components/Toast";

interface Props {
  email?: string;
  requestId?: string;
  navigate: (v: View) => void;
}

export default function AddUserView({ email, requestId, navigate }: Props) {
  const toast = useToast();
  const [name, setName] = useState("");
  const [role, setRole] = useState<"admin" | "member">("member");
  const [tenantId, setTenantId] = useState(TENANTS[0]?.id ?? "");

  const canSubmit = name.trim() !== "" && tenantId !== "";

  function handleSubmit() {
    if (!canSubmit) return;
    if (requestId) {
      approveAccessRequest(requestId, name.trim(), role, [tenantId]);
    } else {
      createStaffUser(name.trim(), email ?? "", role, [tenantId]);
    }
    toast.success(`User ${email ?? name.trim()} created`);
    navigate({ name: "users", tab: "requests" });
  }

  return (
    <EntityShell title="New user">
      <Box sx={{ maxWidth: 480 }}>
        {requestId && (
          <Typography variant="caption" sx={{ color: "text.secondary", display: "block", mb: 2 }}>
            Access requests are for back-office staff.
          </Typography>
        )}
        <FormSection title="User details">
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <TextField label="Name" size="small" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
            <Box>
              <TextField label="Email" size="small" fullWidth value={email ?? ""} disabled={Boolean(requestId)} />
              {requestId && (
                <Typography variant="caption" sx={{ color: "text.secondary", display: "block", mt: 0.5 }}>
                  Verified by Microsoft sign-in.
                </Typography>
              )}
            </Box>
            <FormControl size="small" fullWidth>
              <InputLabel id="add-user-role-label">Role</InputLabel>
              <Select labelId="add-user-role-label" label="Role" value={role} onChange={(e) => setRole(e.target.value as "admin" | "member")}>
                <MenuItem value="admin">Admin</MenuItem>
                <MenuItem value="member">Member</MenuItem>
              </Select>
            </FormControl>
            <FormControl size="small" fullWidth>
              <InputLabel id="add-user-tenant-label">Tenant access</InputLabel>
              <Select labelId="add-user-tenant-label" label="Tenant access" value={tenantId} onChange={(e) => setTenantId(e.target.value)}>
                {TENANTS.map((tenant) => (
                  <MenuItem key={tenant.id} value={tenant.id}>{tenant.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </FormSection>

        <Box sx={{ display: "flex", gap: 1.5, mt: 3 }}>
          <Button variant="outlined" color="inherit" onClick={() => navigate({ name: "users", tab: "requests" })}>Cancel</Button>
          <Button variant="contained" disabled={!canSubmit} onClick={handleSubmit}>Create user</Button>
        </Box>
      </Box>
    </EntityShell>
  );
}

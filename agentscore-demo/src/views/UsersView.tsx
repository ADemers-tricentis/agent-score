import { useState } from "react";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogActions from "@mui/material/DialogActions";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import IconButton from "@mui/material/IconButton";
import Menu from "@mui/material/Menu";
import Tooltip from "@mui/material/Tooltip";
import SvgIcon from "@mui/material/SvgIcon";
import ChipSubtle from "@tricentis/aura/components/ChipSubtle.js";
import type { View, AccessRequest } from "../types";
import { STAFF_USERS, TENANTS, ACCESS_REQUESTS, declineAccessRequest, removeAccessRequest, useMockData } from "../data/mock";
import EntityShell from "../components/EntityShell";
import TintChip from "../components/TintChip";
import EmptyState from "../components/EmptyState";
import { useToast } from "../components/Toast";

interface Props {
  navigate: (v: View) => void;
  tab?: "list" | "requests";
}

const ROLE_COLOR: Record<string, "default" | "primary" | "secondary"> = {
  admin: "primary",
  member: "default",
};

const KEBAB_ICON = "M12 8a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm0 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm0 6a2 2 0 1 0 0 4 2 2 0 0 0 0-4z";
const PAGE_SIZE = 25;

function tenantNames(tenantIds: string[]): string {
  return tenantIds
    .map((id) => TENANTS.find((t) => t.id === id)?.name ?? id)
    .join(", ");
}

const STATE_TINT: Record<AccessRequest["state"], "warning" | "muted" | "success"> = {
  waiting: "warning",
  declined: "muted",
  approved: "success",
};

type StateFacet = AccessRequest["state"] | "all";

export default function UsersView({ navigate, tab = "list" }: Props) {
  useMockData();
  const toast = useToast();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [facet, setFacet] = useState<StateFacet>("waiting");
  const [page, setPage] = useState(0);
  const [menuAnchor, setMenuAnchor] = useState<{ el: HTMLElement; request: AccessRequest } | null>(null);
  const [declineTarget, setDeclineTarget] = useState<AccessRequest | null>(null);
  const [removeTarget, setRemoveTarget] = useState<AccessRequest | null>(null);

  const filtered = ACCESS_REQUESTS.filter((r) => facet === "all" || r.state === facet);
  const total = filtered.length;
  const paged = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const first = total === 0 ? 0 : page * PAGE_SIZE + 1;
  const last = Math.min(total, (page + 1) * PAGE_SIZE);

  function handleFacetChange(value: StateFacet) {
    setFacet(value);
    setPage(0);
  }

  function handleApprove(request: AccessRequest) {
    setMenuAnchor(null);
    if (request.existingUser?.deleted) {
      toast.info("Restore this account to approve the request");
      return;
    }
    navigate({ name: "add-user", email: request.email, requestId: request.id });
  }

  function handleDeclineConfirm() {
    if (declineTarget) {
      declineAccessRequest(declineTarget.id);
      toast.success("Request declined");
    }
    setDeclineTarget(null);
  }

  function handleRemoveConfirm() {
    if (removeTarget) {
      removeAccessRequest(removeTarget.id);
      toast.success("Request removed");
    }
    setRemoveTarget(null);
  }

  return (
    <EntityShell
      title="Users"
      tabs={{
        value: tab,
        items: [
          { label: "Users", value: "list" },
          { label: "Access requests", value: "requests" },
        ],
        onChange: (value) => navigate({ name: "users", tab: value as "list" | "requests" }),
      }}
    >
      {tab === "list" ? (
        <Box sx={{ maxWidth: 900 }}>
          <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", mb: 3 }}>
            <Typography variant="body2" sx={{ color: "text.secondary", maxWidth: 560 }}>
              Staff accounts with access to the AgentScore back office, and which tenants each one
              can see.
            </Typography>
            <Button variant="contained" onClick={() => setInviteOpen(true)} sx={{ flexShrink: 0, ml: 2 }}>
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
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>{user.name}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" sx={{ color: "text.secondary" }}>{user.email}</Typography>
                    </TableCell>
                    <TableCell>
                      <ChipSubtle label={user.role === "admin" ? "Admin" : "Member"} color={ROLE_COLOR[user.role]} sx={{ fontSize: "0.7rem", fontWeight: 600 }} />
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" sx={{ color: "text.secondary" }}>{tenantNames(user.tenantIds)}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" sx={{ color: "text.disabled" }}>{new Date(user.lastActive).toLocaleString()}</Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Paper>

          <Dialog open={inviteOpen} onClose={() => setInviteOpen(false)} maxWidth="sm" fullWidth>
            <DialogTitle sx={{ fontWeight: 700 }}>Invite user</DialogTitle>
            <DialogContent>
              <Typography variant="body2" sx={{ color: "text.secondary", mb: 2 }}>
                Send an invite to a new staff account. This is a demo placeholder - no invite is
                actually sent.
              </Typography>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setInviteOpen(false)} color="inherit" sx={{ color: "text.secondary" }}>Cancel</Button>
              <Button variant="contained" onClick={() => setInviteOpen(false)}>Send invite</Button>
            </DialogActions>
          </Dialog>
        </Box>
      ) : (
        <Box sx={{ maxWidth: 1100 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
            <FormControl size="small" sx={{ minWidth: 160 }}>
              <InputLabel id="access-request-state-label">State</InputLabel>
              <Select
                labelId="access-request-state-label"
                label="State"
                value={facet}
                onChange={(e) => handleFacetChange(e.target.value as StateFacet)}
                data-testid="filter-state"
              >
                <MenuItem value="waiting">Waiting</MenuItem>
                <MenuItem value="declined">Declined</MenuItem>
                <MenuItem value="approved">Approved</MenuItem>
                <MenuItem value="all">All</MenuItem>
              </Select>
            </FormControl>
            {total > 0 && (
              <Typography variant="caption" sx={{ color: "text.secondary" }}>{total} requests</Typography>
            )}
          </Box>

          <Paper sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2, overflow: "hidden" }}>
            {paged.length === 0 ? (
              <EmptyState
                testId="access-requests-empty"
                title="Nothing waiting"
                description={facet === "waiting" ? "Nobody is waiting on access right now." : "Try a different filter."}
              />
            ) : (
              <Table sx={{ tableLayout: "fixed" }}>
                <TableHead>
                  <TableRow sx={{ bgcolor: "action.hover" }}>
                    <TableCell sx={{ fontWeight: 600, color: "text.secondary", width: "42%" }}>Email</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600, color: "text.secondary", width: "18%" }}>Requested</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: "text.secondary", width: "16%" }}>State</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: "text.secondary", width: "16%" }}>Account</TableCell>
                    <TableCell sx={{ width: "8%" }} />
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paged.map((request) => (
                    <TableRow key={request.id} sx={{ "&:last-child td": { borderBottom: 0 } }}>
                      <TableCell>
                        <Typography variant="body2" title={request.email} sx={{ fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {request.email}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="caption" sx={{ color: "text.secondary" }}>{new Date(request.requestedAt).toLocaleString()}</Typography>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: "flex", flexDirection: "column", gap: 0.25 }}>
                          <TintChip tint={STATE_TINT[request.state]} label={request.state} />
                          {request.state === "waiting" && request.declinedAt && (
                            <Typography variant="caption" sx={{ color: "text.secondary" }}>
                              Previously declined {new Date(request.declinedAt).toLocaleDateString()}
                            </Typography>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        {!request.existingUser ? (
                          <Typography variant="body2" sx={{ color: "text.secondary" }}>—</Typography>
                        ) : (
                          <TintChip tint={request.existingUser.deleted ? "destructive" : "success"} label={request.existingUser.deleted ? "deleted" : "active"} />
                        )}
                      </TableCell>
                      <TableCell align="right">
                        <IconButton size="small" aria-label={`Actions for ${request.email}`} onClick={(e) => setMenuAnchor({ el: e.currentTarget, request })}>
                          <SvgIcon fontSize="small"><path d={KEBAB_ICON} /></SvgIcon>
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Paper>

          {total > 0 && (
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 1.5, mt: 1.5 }}>
              <Typography variant="caption" sx={{ color: "text.secondary" }}>{first}–{last} of {total}</Typography>
              <Button size="small" variant="outlined" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>Previous</Button>
              <Button size="small" variant="outlined" disabled={last >= total} onClick={() => setPage((p) => p + 1)}>Next</Button>
            </Box>
          )}

          <Menu anchorEl={menuAnchor?.el} open={Boolean(menuAnchor)} onClose={() => setMenuAnchor(null)}>
            {menuAnchor?.request.state === "waiting" && (
              menuAnchor.request.existingUser && !menuAnchor.request.existingUser.deleted ? (
                <Tooltip title="Already has an account — remove this request." placement="left">
                  <span>
                    <MenuItem disabled data-testid="row-action-approve">Approve</MenuItem>
                  </span>
                </Tooltip>
              ) : (
                <MenuItem data-testid="row-action-approve" onClick={() => handleApprove(menuAnchor.request)}>Approve</MenuItem>
              )
            )}
            {menuAnchor?.request.state === "waiting" && (
              <MenuItem data-testid="row-action-decline" onClick={() => { setDeclineTarget(menuAnchor.request); setMenuAnchor(null); }}>Decline</MenuItem>
            )}
            {menuAnchor && (
              <MenuItem data-testid="row-action-remove" sx={{ color: "error.main" }} onClick={() => { setRemoveTarget(menuAnchor.request); setMenuAnchor(null); }}>Remove</MenuItem>
            )}
          </Menu>

          <Dialog open={Boolean(declineTarget)} onClose={() => setDeclineTarget(null)} maxWidth="sm" fullWidth>
            <DialogTitle sx={{ fontWeight: 700 }}>Decline {declineTarget?.email}?</DialogTitle>
            <DialogContent>
              <DialogContentText>The person can ask again from the no-access screen. This does not block them permanently.</DialogContentText>
            </DialogContent>
            <DialogActions>
              <Button variant="outlined" onClick={() => setDeclineTarget(null)} data-testid="decline-cancel">Cancel</Button>
              <Button variant="contained" color="error" onClick={handleDeclineConfirm} data-testid="decline-confirm">Decline</Button>
            </DialogActions>
          </Dialog>

          <Dialog open={Boolean(removeTarget)} onClose={() => setRemoveTarget(null)} maxWidth="sm" fullWidth>
            <DialogTitle sx={{ fontWeight: 700 }}>Remove {removeTarget?.email}?</DialogTitle>
            <DialogContent>
              <DialogContentText>Deletes the row outright. If they ask again, it starts as a fresh request.</DialogContentText>
            </DialogContent>
            <DialogActions>
              <Button variant="outlined" onClick={() => setRemoveTarget(null)} data-testid="remove-cancel">Cancel</Button>
              <Button variant="contained" color="error" onClick={handleRemoveConfirm} data-testid="remove-confirm">Remove</Button>
            </DialogActions>
          </Dialog>
        </Box>
      )}
    </EntityShell>
  );
}

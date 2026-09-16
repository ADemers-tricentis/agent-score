/** UserEditPage — edit one user's email / role / memberships / lifecycle.
 *
 * Layout mirrors the design ref:
 *  - Pinned header banner (breadcrumb + name + role chip + status dot + meta)
 *  - General FormSection (email + role radio cards)
 *  - Tenant memberships (members only — admins implicitly access all)
 *  - Sessions (revoke + reset password)
 *  - Danger zone (soft-delete / restore)
 *
 * Self-row actions are disabled so you can't lock yourself out.
 */

import { useEffect, useMemo, useState } from "react";
import { Link, useParams, useSearch } from "@tanstack/react-router";
import { toast } from "@/shared/lib/toast";
import Box from "@mui/material/Box";
import Breadcrumbs from "@mui/material/Breadcrumbs";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import FormLabel from "@mui/material/FormLabel";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { alpha } from "@mui/material/styles";
import BreadcrumbsItem from "@tricentis/aura/components/BreadcrumbsItem.js";
import IconMaterialSymbolsAdd from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsAdd.mjs";
import IconMaterialSymbolsApartment from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsApartment.mjs";
import IconMaterialSymbolsDelete from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsDelete.mjs";
import IconMaterialSymbolsInfo from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsInfo.mjs";
import IconMaterialSymbolsKey from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsKey.mjs";
import IconMaterialSymbolsLogout from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsLogout.mjs";
import IconMaterialSymbolsReplay from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsReplay.mjs";
import IconMaterialSymbolsSave from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsSave.mjs";

import { passwordSignInAvailable } from "@/shared/auth/api";
import { useAuth } from "@/shared/auth/use-auth";
import {
  CURRENT_USER_ID,
  FAKE_TENANT_OPTIONS,
  addMembershipFake,
  approveAccessRequestFake,
  deleteUserFake,
  getUserFake,
  removeMembershipFake,
  restoreUserFake,
  revokeSessionsFake,
  updateUserFake,
} from "@/back-office/users/fake-data";
import { Chip } from "@/shared/components/chip";
import { Combobox } from "@/shared/components/combobox";
import { DangerZone } from "@/shared/components/danger-zone";
import { EntityShell } from "@/shared/components/entity-shell";
import { FormSection } from "@/shared/components/form-section";
import { NotFoundState } from "@/shared/components/not-found-state";
import { PasswordInput } from "@/shared/components/password-input";
import { RadioCards } from "@/shared/components/radio-cards";
import { StatusDot } from "@/shared/components/status-dot";

type Role = "member" | "superadmin";

export function UserEditPage() {
  // `strict: false` avoids brittleness around how TanStack Router computes
  // the route ID under a pathless layout parent.
  const { userId } = useParams({ strict: false }) as { userId: string };
  // Arrives from the Access requests queue's Approve action when the
  // address belongs to a soft-deleted account (mock screen 10) — the row to
  // stamp approved in the same transaction as the restore below.
  const { request } = useSearch({ strict: false }) as { request?: string };
  const { accessConfig } = useAuth();
  const currentUser = { user_id: CURRENT_USER_ID };

  const [refreshTick, setRefreshTick] = useState(0);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const user = useMemo(() => getUserFake(userId), [userId, refreshTick]);

  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>("member");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmRevoke, setConfirmRevoke] = useState(false);
  const [pwOpen, setPwOpen] = useState(false);
  const [pw, setPw] = useState("");
  const [addTenantId, setAddTenantId] = useState<string | undefined>();
  const [confirmRestore, setConfirmRestore] = useState(false);

  useEffect(() => {
    if (user) {
      setEmail(user.email);
      setRole(user.is_superadmin ? "superadmin" : "member");
    }
  }, [user]);

  const invalidate = () => setRefreshTick((t) => t + 1);

  const save = {
    isPending: false,
    mutate: () => {
      updateUserFake(userId, { email: email.trim(), is_superadmin: role === "superadmin" });
      toast.success("User updated");
      invalidate();
    },
  };

  const addMembership = {
    isPending: false,
    mutate: (tenantId: string) => {
      addMembershipFake(userId, tenantId);
      toast.success("Tenant added");
      setAddTenantId(undefined);
      invalidate();
    },
  };

  const removeMembership = {
    isPending: false,
    mutate: (tenantId: string) => {
      removeMembershipFake(userId, tenantId);
      toast.success("Tenant removed");
      invalidate();
    },
  };

  const resetPassword = {
    isPending: false,
    mutate: () => {
      toast.success("Password updated");
      setPw("");
      setPwOpen(false);
      invalidate();
    },
  };

  const revoke = {
    isPending: false,
    mutate: () => {
      const r = revokeSessionsFake(userId);
      toast.success(`Revoked ${r.revoked} session(s)`);
      setConfirmRevoke(false);
      invalidate();
    },
  };

  const softDelete = {
    isPending: false,
    mutate: () => {
      deleteUserFake(userId);
      toast.success("User soft-deleted");
      setConfirmDelete(false);
      invalidate();
    },
  };

  const restore = {
    isPending: false,
    mutate: () => {
      restoreUserFake(userId);
      if (request) approveAccessRequestFake(request);
      toast.success("User restored");
      setConfirmRestore(false);
      invalidate();
    },
  };

  // Staff sign in through Microsoft or the gateway under `entra`/`gateway`
  // mode — there is no hash to reset. Revoke stays: it drops sessions
  // regardless of how they signed in.
  const entraStaffNoPassword =
    accessConfig != null &&
    !passwordSignInAvailable(accessConfig) &&
    user?.kind === "staff";
  const isSelf = currentUser?.user_id === userId;
  const isDeleted = Boolean(user?.deleted_at);
  const dirty =
    user !== undefined &&
    (email.trim() !== user.email ||
      (role === "superadmin") !== user.is_superadmin);

  const availableTenants = useMemo(() => {
    const member = new Set(user?.tenants.map((t) => t.tenant_id) ?? []);
    return FAKE_TENANT_OPTIONS.filter((t) => !member.has(t.tenant_id));
  }, [user]);

  if (!user) {
    return (
      <NotFoundState
        entity="User"
        action={
          <Button
            component={Link}
            to="/users"
            variant="outlined"
            data-testid="user-not-found-back"
          >
            Back to users
          </Button>
        }
      />
    );
  }

  return (
    <EntityShell
      breadcrumb={
        <Breadcrumbs data-slot="breadcrumb" aria-label="breadcrumb">
          <BreadcrumbsItem
            data-slot="breadcrumb-link"
            component={Link}
            to="/users"
            label="Users"
          />
          <Typography
            data-slot="breadcrumb-page"
            component="span"
            variant="body2"
            color="text.primary"
            aria-current="page"
          >
            {user.email}
          </Typography>
        </Breadcrumbs>
      }
      title={user.email}
      badges={
        <>
          <Chip tint={user.is_superadmin ? "info" : "muted"}>
            {user.is_superadmin ? "admin" : "member"}
          </Chip>
          {isDeleted ? (
            <StatusDot status="destructive">deleted</StatusDot>
          ) : (
            <StatusDot status="success">active</StatusDot>
          )}
          {isSelf ? <Chip tint="warning">you</Chip> : null}
        </>
      }
      meta={
        <>
          <Box component="span" sx={{ fontFamily: "monospace" }}>
            {user.user_id}
          </Box>
          <Box component="span">·</Box>
          <Box component="span">
            Created {new Date(user.created_at).toLocaleDateString()}
          </Box>
        </>
      }
    >
      <Box sx={{ px: 4, py: 3 }}>
        <Stack sx={{ maxWidth: 1024, gap: 3 }}>
          <FormSection
            title="General"
            description="Email is the login identity. Role gates back-office access scope — admins can change any other user's role here."
          >
            <TextField
              id="edit-user-email"
              type="email"
              label="Email"
              value={email}
              disabled={isSelf || isDeleted}
              onChange={(e) => setEmail(e.target.value)}
              fullWidth
              slotProps={{
                htmlInput: { "data-testid": "user-email-input" },
              }}
            />
            <Stack sx={{ gap: 0.75 }}>
              <FormLabel>Role</FormLabel>
              <RadioCards
                value={role}
                testIdPrefix="user-role"
                onValueChange={(v) => setRole(v as Role)}
                disabled={isSelf || isDeleted}
                items={[
                  {
                    value: "member",
                    label: "Member",
                    description: "Bound to specific tenants.",
                  },
                  {
                    value: "superadmin",
                    label: "Admin",
                    description: "Cross-tenant access.",
                  },
                ]}
              />
            </Stack>
            <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
              <Button
                variant="contained"
                data-testid="save-general"
                disabled={!dirty || isSelf || isDeleted || save.isPending}
                onClick={() => save.mutate()}
                startIcon={<IconMaterialSymbolsSave sx={{ fontSize: 16 }} />}
              >
                Save changes
              </Button>
            </Box>
          </FormSection>

          {role === "member" ? (
            <FormSection
              title="Tenant memberships"
              description="Tenants this user can access. Admins implicitly access all tenants."
              bare
            >
              <Box
                sx={{
                  overflow: "hidden",
                  borderRadius: 1.5,
                  border: 1,
                  borderColor: "divider",
                  bgcolor: "background.paper",
                }}
              >
                {user.tenants.length === 0 ? (
                  <Box sx={{ px: 2.5, py: 2, typography: "body1", color: "text.secondary" }}>
                    No tenants yet.
                  </Box>
                ) : (
                  <Box component="ul" sx={{ listStyle: "none", m: 0, p: 0 }}>
                    {user.tenants.map((t) => {
                      const label = t.name ?? t.tenant_id;
                      return (
                        <Box
                          component="li"
                          key={t.tenant_id}
                          data-testid={`membership-${t.tenant_id}`}
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            px: 2.5,
                            py: 1.5,
                            borderTop: 1,
                            borderColor: "divider",
                            "&:first-of-type": { borderTop: 0 },
                          }}
                        >
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
                            <IconMaterialSymbolsApartment
                              sx={{ fontSize: 16, color: "text.secondary" }}
                            />
                            <Box>
                              <Box sx={{ typography: "body2", fontWeight: 500 }}>
                                {label}
                              </Box>
                              <Box
                                sx={{
                                  fontFamily: "monospace",
                                  typography: "caption",
                                  color: "text.secondary",
                                }}
                              >
                                {t.tenant_id}
                              </Box>
                            </Box>
                          </Box>
                          <Button
                            variant="text"
                            size="small"
                            color="error"
                            data-testid="remove-member"
                            disabled={
                              isSelf || isDeleted || removeMembership.isPending
                            }
                            onClick={() => removeMembership.mutate(t.tenant_id)}
                          >
                            Remove
                          </Button>
                        </Box>
                      );
                    })}
                  </Box>
                )}
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    borderTop: 1,
                    borderColor: "divider",
                    bgcolor: "action.hover",
                    px: 2.5,
                    py: 1.5,
                  }}
                >
                  <Box sx={{ flex: 1 }}>
                    <Combobox
                      options={availableTenants.map((t) => ({
                        value: t.tenant_id,
                        label: t.name,
                        description: `${t.kind}${t.env ? ` · ${t.env}` : ""}`,
                        searchText: t.name,
                      }))}
                      value={addTenantId}
                      onChange={setAddTenantId}
                      placeholder={
                        availableTenants.length === 0
                          ? "No more tenants to add"
                          : "Add tenant…"
                      }
                      disabled={
                        isSelf || isDeleted || availableTenants.length === 0
                      }
                    />
                  </Box>
                  <Button
                    variant="contained"
                    data-testid="add-member"
                    disabled={
                      !addTenantId ||
                      isSelf ||
                      isDeleted ||
                      addMembership.isPending
                    }
                    onClick={() =>
                      addTenantId && addMembership.mutate(addTenantId)
                    }
                    startIcon={<IconMaterialSymbolsAdd sx={{ fontSize: 16 }} />}
                  >
                    Add
                  </Button>
                </Box>
              </Box>
            </FormSection>
          ) : null}

          <FormSection
            title="Sessions"
            description="Reset password and revoke active back-office sessions."
          >
            <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 1 }}>
              {entraStaffNoPassword ? (
                <Typography
                  data-testid="user-password-disabled"
                  variant="body2"
                  sx={{ color: "text.secondary" }}
                >
                  Signs in through Microsoft or the Tricentis gateway — no password to reset.
                </Typography>
              ) : (
                <Button
                  variant="outlined"
                  data-testid="user-reset-password"
                  onClick={() => setPwOpen(true)}
                  disabled={isSelf || isDeleted}
                  startIcon={<IconMaterialSymbolsKey sx={{ fontSize: 16 }} />}
                >
                  Reset password
                </Button>
              )}
              <Button
                variant="outlined"
                data-testid="user-revoke"
                onClick={() => setConfirmRevoke(true)}
                disabled={isSelf || isDeleted}
                startIcon={<IconMaterialSymbolsLogout sx={{ fontSize: 16 }} />}
              >
                Revoke all sessions
              </Button>
            </Box>
            {isSelf ? (
              <Typography variant="caption" sx={{ color: "text.secondary" }}>
                Self-revoke and self-rotate are disabled — handle your own
                account from the sign-in flow.
              </Typography>
            ) : null}
          </FormSection>

          {request && isDeleted ? (
            <Box
              data-testid="access-request-restore-banner"
              sx={{
                display: "flex",
                gap: 1.25,
                alignItems: "flex-start",
                borderRadius: 1.5,
                border: 1,
                borderColor: "primary.main",
                bgcolor: (theme) => alpha(theme.palette.primary.main, 0.08),
                px: 2,
                py: 1.5,
              }}
            >
              <IconMaterialSymbolsInfo
                sx={{ fontSize: 17, color: "primary.main", flexShrink: 0, mt: 0.125 }}
              />
              <Typography variant="body2" sx={{ color: "text.primary" }}>
                This person has asked for access again. Restore the account to
                approve the request — their previous tenants and role come
                back with it.
              </Typography>
            </Box>
          ) : null}

          <FormSection
            title="Danger zone"
            description="Soft-delete revokes all sessions and hides the row. Tenant memberships and role are preserved and come back with Restore."
            tone="destructive"
            bare
          >
            <DangerZone>
              {isDeleted ? (
                <DangerZone.Row
                  title="Restore user"
                  description="Bring this user back to active. Their tenant memberships and role are restored with the account."
                  action={
                    <Button
                      variant="outlined"
                      data-testid="user-restore"
                      onClick={() => setConfirmRestore(true)}
                      disabled={restore.isPending}
                      startIcon={<IconMaterialSymbolsReplay sx={{ fontSize: 16 }} />}
                    >
                      Restore
                    </Button>
                  }
                />
              ) : (
                <DangerZone.Row
                  title="Soft-delete user"
                  description="Revokes all sessions and removes all tenant memberships. The user row is preserved and can be restored."
                  action={
                    <Button
                      variant="contained"
                      color="error"
                      data-testid="user-delete"
                      onClick={() => setConfirmDelete(true)}
                      disabled={isSelf}
                      startIcon={<IconMaterialSymbolsDelete sx={{ fontSize: 16 }} />}
                    >
                      Soft-delete
                    </Button>
                  }
                />
              )}
            </DangerZone>
          </FormSection>
        </Stack>
      </Box>

      <Dialog open={pwOpen} onClose={() => setPwOpen(false)}>
        <DialogTitle>Reset password for {user.email}</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Sets a new initial password. Existing sessions for this user are
            dropped on save.
          </DialogContentText>
          <Stack sx={{ gap: 0.75 }}>
            <FormLabel htmlFor="reset-pw">New password</FormLabel>
            <PasswordInput
              id="reset-pw"
              autoComplete="new-password"
              alwaysVisible
              showGenerate
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              onGenerate={setPw}
            />
            <Typography variant="caption" sx={{ color: "text.secondary" }}>
              Min 8 characters. Share with the user out-of-band.
            </Typography>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button
            variant="outlined"
            data-testid="reset-password-cancel"
            onClick={() => setPwOpen(false)}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            data-testid="reset-password-confirm"
            disabled={pw.length < 8 || resetPassword.isPending}
            onClick={() => resetPassword.mutate()}
            startIcon={<IconMaterialSymbolsSave sx={{ fontSize: 16 }} />}
          >
            Set password
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={confirmRevoke} onClose={() => setConfirmRevoke(false)}>
        <DialogTitle>Revoke all sessions for {user.email}?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            The user will be signed out everywhere immediately. They can sign
            back in with their existing password.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            variant="outlined"
            data-testid="revoke-cancel"
            onClick={() => setConfirmRevoke(false)}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            data-testid="revoke-confirm"
            onClick={() => revoke.mutate()}
            disabled={revoke.isPending}
            startIcon={<IconMaterialSymbolsLogout sx={{ fontSize: 16 }} />}
          >
            Revoke all
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={confirmDelete} onClose={() => setConfirmDelete(false)}>
        <DialogTitle>Soft-delete {user.email}?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Revokes all sessions and hides the user from active lists.
            Tenant memberships and role are preserved and come back with a
            restore.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            variant="outlined"
            data-testid="delete-cancel"
            onClick={() => setConfirmDelete(false)}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            data-testid="delete-confirm"
            onClick={() => softDelete.mutate()}
            disabled={softDelete.isPending}
            startIcon={<IconMaterialSymbolsDelete sx={{ fontSize: 16 }} />}
          >
            Soft-delete
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={confirmRestore} onClose={() => setConfirmRestore(false)}>
        <DialogTitle>Restore {user.email}?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Reinstates their tenant memberships{user.is_superadmin ? " and the admin flag" : ""}
            {request
              ? ", and permanently stamps the access request approved."
              : "."}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            variant="outlined"
            data-testid="restore-cancel"
            onClick={() => setConfirmRestore(false)}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            data-testid="restore-confirm"
            onClick={() => restore.mutate()}
            disabled={restore.isPending}
            startIcon={<IconMaterialSymbolsReplay sx={{ fontSize: 16 }} />}
          >
            Restore
          </Button>
        </DialogActions>
      </Dialog>
    </EntityShell>
  );
}

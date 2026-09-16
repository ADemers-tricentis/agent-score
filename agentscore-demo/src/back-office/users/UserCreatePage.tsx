/** UserCreatePage — create a back-office user.
 *
 * Mirrors the "Add user" dialog in the design ref, rendered as a full page
 * for richer validation (initial tenants picker, password generator).
 */

import { useState } from "react";
import { Link, useNavigate, useSearch } from "@tanstack/react-router";
import { toast } from "@/shared/lib/toast";
import Box from "@mui/material/Box";
import Breadcrumbs from "@mui/material/Breadcrumbs";
import Button from "@mui/material/Button";
import FormLabel from "@mui/material/FormLabel";
import InputAdornment from "@mui/material/InputAdornment";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import BreadcrumbsItem from "@tricentis/aura/components/BreadcrumbsItem.js";
import IconMaterialSymbolsLock from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsLock.mjs";
import IconMaterialSymbolsSave from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsSave.mjs";

import { FAKE_TENANT_OPTIONS, createUserFake } from "@/back-office/users/fake-data";
import { passwordSignInAvailable } from "@/shared/auth/api";
import { useAuth } from "@/shared/auth/use-auth";
import { FormSection } from "@/shared/components/form-section";
import { MultiSelect } from "@/shared/components/combobox";
import { PasswordInput } from "@/shared/components/password-input";
import { RadioCards } from "@/shared/components/radio-cards";

type Role = "member" | "superadmin";
type Kind = "staff" | "customer";

export function UserCreatePage() {
  const { accessConfig } = useAuth();
  // Arrives from the Access requests queue's Approve action (mock screen
  // 09) — `email` prefills-and-locks the identity field, `request` rides the
  // create call so the same transaction stamps that row approved.
  const { email: prefillEmail, request } = useSearch({ strict: false }) as {
    email?: string;
    request?: string;
  };
  const [email, setEmail] = useState(prefillEmail ?? "");
  const [password, setPassword] = useState("");
  const [kind, setKind] = useState<Kind>("staff");
  const [role, setRole] = useState<Role>("member");
  const [tenantIds, setTenantIds] = useState<string[]>([]);

  const navigate = useNavigate();

  // Password on create: required for a customer, required for staff under
  // `password` mode, refused for staff under `entra`/`gateway` — there is
  // nothing to set, the person signs in through Microsoft or the gateway.
  // Guarded by `accessConfig != null` so the still-booting case (where the
  // mode is unknown) defaults to password mode rather than to passwordless.
  const staffPasswordless =
    accessConfig != null && !passwordSignInAvailable(accessConfig);
  // An access-request approval is always a Microsoft-authenticated staff
  // account, whatever the mode — the person already signed in with Microsoft
  // to land in the queue, so a request id widens the passwordless case
  // alongside the mode test.
  const passwordlessStaff =
    (staffPasswordless || Boolean(request)) && kind === "staff";

  const [creating, setCreating] = useState(false);

  const create = {
    isPending: creating,
    mutate: () => {
      setCreating(true);
      createUserFake({
        email: email.trim(),
        kind,
        is_superadmin: role === "superadmin",
        tenant_ids: role === "superadmin" ? [] : tenantIds,
      });
      toast.success(`User ${email} created`);
      setCreating(false);
      // Back to the queue when this create approved a request, not the
      // users list — mirrors mock screen 09's "On save… then back to the
      // queue, not to the users list."
      void navigate({ to: request ? "/users/requests" : "/users" });
    },
  };

  const disabled =
    email.trim().length === 0 ||
    (!passwordlessStaff && password.length < 8) ||
    create.isPending;

  return (
    <Box
      sx={{
        display: "flex",
        minHeight: 0,
        flex: 1,
        flexDirection: "column",
        overflowY: "auto",
        px: 4,
        py: 3,
      }}
    >
      <Stack sx={{ width: "100%", maxWidth: 1024, gap: 3 }}>
        <Box>
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
              New user
            </Typography>
          </Breadcrumbs>
          <Typography
            component="h1"
            variant="h3"
            sx={{
              mt: 1.5,
              fontWeight: 600,
              letterSpacing: "-0.025em",
            }}
          >
            Add user
          </Typography>
          <Typography
            variant="subtitle1"
            sx={{ mt: 0.5, color: "text.secondary" }}
          >
            {passwordlessStaff
              ? "Creates a back-office user. They sign in with Microsoft or through the Tricentis gateway — no password is set."
              : "Creates a back-office user. Admin sets the initial password — the user can change it after first login."}
          </Typography>
        </Box>

        <FormSection
          title="General"
          description="Email is the login identity. Kind picks which application the account belongs to; Role gates back-office access scope."
        >
          <Stack sx={{ gap: 0.75 }}>
            <TextField
              id="new-user-email"
              type="email"
              label={
                <>
                  Email <Box component="span" sx={{ color: "error.main" }}>*</Box>
                </>
              }
              autoComplete="off"
              placeholder="user@tricentis.com"
              value={email}
              disabled={Boolean(request)}
              onChange={(e) => setEmail(e.target.value)}
              fullWidth
              slotProps={{
                htmlInput: { "data-testid": "user-email-input" },
                input: request
                  ? {
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconMaterialSymbolsLock
                            sx={{ fontSize: 14, color: "text.secondary" }}
                          />
                        </InputAdornment>
                      ),
                    }
                  : undefined,
              }}
            />
            {request ? (
              <Typography variant="caption" sx={{ color: "text.secondary" }}>
                Verified by Microsoft sign-in.
              </Typography>
            ) : null}
          </Stack>
          {passwordlessStaff ? null : (
            <Stack sx={{ gap: 0.75 }}>
              <FormLabel htmlFor="new-user-password">
                Initial password <Box component="span" sx={{ color: "error.main" }}>*</Box>
              </FormLabel>
              <PasswordInput
                id="new-user-password"
                autoComplete="new-password"
                alwaysVisible
                showGenerate
                placeholder="At least 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onGenerate={setPassword}
              />
              <Typography variant="caption" sx={{ color: "text.secondary" }}>
                Share with the user out-of-band. They can change it on first
                login.
              </Typography>
            </Stack>
          )}
          <Stack sx={{ gap: 0.75 }}>
            <FormLabel>Kind</FormLabel>
            <RadioCards
              value={kind}
              testIdPrefix="user-kind"
              onValueChange={(v) => {
                const next = v as Kind;
                setKind(next);
                // A customer can never be a superadmin (refused at the
                // route and again by ck_users_customer_not_superadmin). Drop a
                // stale superadmin pick instead of submitting a combination the
                // backend will reject.
                if (next === "customer") setRole("member");
              }}
              items={[
                {
                  value: "staff",
                  label: "Staff",
                  description: staffPasswordless
                    ? "Signs in through Microsoft or the Tricentis gateway — no password to set."
                    : "Tricentis operator — signs in to the back-office.",
                },
                {
                  value: "customer",
                  label: "Customer",
                  description: "Signs in to the customer portal only.",
                  disabled: Boolean(request),
                },
              ]}
            />
            {request ? (
              <Typography variant="caption" sx={{ color: "text.secondary" }}>
                Access requests are for back-office staff.
              </Typography>
            ) : (
              <Typography variant="caption" sx={{ color: "text.secondary" }}>
                Immutable after creation. A mis-created account is fixed by
                soft-delete and recreate.
              </Typography>
            )}
          </Stack>
          <Stack sx={{ gap: 0.75 }}>
            <FormLabel>Role</FormLabel>
            <RadioCards
              value={role}
              testIdPrefix="user-role"
              onValueChange={(v) => setRole(v as Role)}
              items={[
                {
                  value: "member",
                  label: "Member",
                  description: "Bound to specific tenants.",
                },
                {
                  value: "superadmin",
                  label: "Superadmin",
                  description: "Cross-tenant access.",
                  disabled: kind === "customer",
                },
              ]}
            />
            {kind === "customer" ? (
              <Typography variant="caption" sx={{ color: "text.secondary" }}>
                Customers cannot be superadmins.
              </Typography>
            ) : null}
          </Stack>
        </FormSection>

        {role === "member" ? (
          <FormSection
            title="Initial tenants"
            description="Tenants this user will access. Skip for superadmins — they implicitly access all tenants."
          >
            <Stack sx={{ gap: 0.75 }}>
              <FormLabel>Tenants</FormLabel>
              <MultiSelect
                options={FAKE_TENANT_OPTIONS.map((t) => ({
                  value: t.tenant_id,
                  label: t.name,
                  description: `${t.kind}${t.env ? ` · ${t.env}` : ""}`,
                  searchText: t.name,
                }))}
                values={tenantIds}
                onChange={setTenantIds}
                placeholder="Add tenants…"
              />
              <Typography variant="caption" sx={{ color: "text.secondary" }}>
                Memberships can be edited later from the user's detail page.
              </Typography>
            </Stack>
          </FormSection>
        ) : null}

        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 1 }}>
          <Button
            variant="outlined"
            data-testid="cancel-user"
            onClick={() => void navigate({ to: "/users" })}
            disabled={create.isPending}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            disabled={disabled}
            onClick={() => create.mutate()}
            data-testid="create-user-submit"
            startIcon={<IconMaterialSymbolsSave sx={{ fontSize: 16 }} />}
          >
            Add user
          </Button>
        </Box>
      </Stack>
    </Box>
  );
}

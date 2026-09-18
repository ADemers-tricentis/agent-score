/** TenantDetailLayout — shell for the tenant detail sub-app.
 *
 * Loads the tenant and renders a TenantShell with the URL-segment
 * subtabs (Overview / Agents / Members / Settings / Audit Log). Each
 * subroute renders into `<Outlet />` below the shell chrome.
 */

import { useFakeQuery as useQuery } from "@/back-office/agents/fake-query";
import { Link, Outlet, useParams } from "@tanstack/react-router";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Skeleton from "@mui/material/Skeleton";

import * as api from "@/back-office/tenants/tenant-fixtures";
import { Chip } from "@/shared/components/chip";
import { NotFoundState } from "@/shared/components/not-found-state";
import { StatusDot } from "@/shared/components/status-dot";
import { TenantShell } from "@/shared/components/tenant-shell";

export function TenantDetailLayout() {
  const { tenantId } = useParams({ strict: false }) as { tenantId: string };

  const tenantQuery = useQuery({
    queryKey: ["tenant", tenantId],
    queryFn: () => api.getTenant(tenantId),
    // A bogus/deleted id throws 404 — surface not-found immediately instead of
    // retrying for seconds behind a skeleton.
    retry: false,
  });

  const tenant = tenantQuery.data;

  if (tenantQuery.isLoading) {
    return (
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2, px: 4, py: 3 }}>
        <Skeleton variant="rounded" sx={{ height: 48, width: "33.333%" }} />
        <Skeleton variant="rounded" sx={{ height: 128, width: "100%" }} />
      </Box>
    );
  }

  if (tenantQuery.isError || !tenant) {
    return (
      <NotFoundState
        entity="Tenant"
        action={
          <Button
            component={Link}
            to="/tenants"
            variant="outlined"
            data-testid="tenant-not-found-back"
          >
            Back to tenants
          </Button>
        }
      />
    );
  }

  // `tenant` is guaranteed past the loading + not-found guards above.
  return (
    <TenantShell
      tenantId={tenantId}
      tenantName={tenant.name}
      badges={<TenantBadges tenant={tenant} />}
      meta={
        <>
          <Box component="span" sx={{ fontFamily: "monospace" }}>
            {tenant.tenant_id}
          </Box>
          <span>·</span>
          <span>
            Created {new Date(tenant.created_at).toLocaleDateString()}
          </span>
        </>
      }
    >
      <Outlet />
    </TenantShell>
  );
}

function TenantBadges({ tenant }: { tenant: api.TenantProfile }) {
  return (
    <>
      <Chip tint={tenant.kind === "internal" ? "info" : "muted"}>
        {tenant.kind}
      </Chip>
      {tenant.env ? <Chip tint="muted">env: {tenant.env}</Chip> : null}
      {tenant.deleted_at ? (
        <StatusDot status="destructive">deleted</StatusDot>
      ) : (
        <StatusDot status="success">active</StatusDot>
      )}
    </>
  );
}

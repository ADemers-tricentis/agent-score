/** TenantIntegrationsPage — the tenant detail Integrations tab (external
 *  tenants only), replacing the API-keys section that used to live on
 *  Settings. Mounts the shared `ApiKeysPanel` over `back-office/tenants/api.ts`,
 *  with `tenantId` from the route already closed over and no `maxKeys` — the
 *  20-key cap is customer-side only, so an operator recovering a customer's
 *  account is never blocked by it.
 *
 *  The tab strip (`tenant-shell.tsx`) already hides this tab for an internal
 *  tenant, but the route itself is registered unconditionally (a direct URL
 *  visit reaches this component regardless of kind — an accepted gap, not a
 *  gate). Without a body-level check, that direct visit mounts a
 *  fully-formed, empty-looking panel with an enabled create button that can
 *  only fail: the admin API refuses a non-external tenant with
 *  `tenant_not_external` on every route including the list, and a plausible
 *  "no keys yet" table is a worse failure than an explicit refusal. This
 *  reads `tenant.kind` off the same `["tenant", tenantId]` query
 *  `TenantDetailLayout` already populated (no extra round trip in practice)
 *  and refuses before ever constructing the adapter or mounting the panel.
 *  Critically, it decides nothing until the tenant is actually known: on a
 *  cold cache the query is pending on first render (`data` is `undefined`,
 *  which fails a naive `kind !== "external"` check the same way "external"
 *  would), so the loading/error branches below must resolve *before* the
 *  kind check — deciding on incomplete data is exactly the hole this guard
 *  exists to close.
 *
 *  The adapter itself lives in `api-keys-adapter.ts`, split out for the same
 *  reason `customer/integrations/adapter.ts` is: this module must export only
 *  the page component (`react-refresh/only-export-components`).
 */

import { useParams } from "@tanstack/react-router";
import { useFakeQuery as useQuery } from "@/back-office/agents/fake-query";
import Box from "@mui/material/Box";
import Skeleton from "@mui/material/Skeleton";

import * as api from "@/back-office/tenants/tenant-fixtures";
import { makeAdapter } from "@/back-office/tenants/api-keys-adapter";
import { ApiKeysPanel } from "@/shared/components/api-keys/ApiKeysPanel";
import { ErrorState } from "@/shared/components/error-state";

export function TenantIntegrationsPage() {
  const { tenantId } = useParams({ strict: false }) as { tenantId: string };

  const tenantQuery = useQuery({
    queryKey: ["tenant", tenantId],
    queryFn: () => api.getTenant(tenantId),
  });

  // Matches `TenantDetailLayout`'s own loading skeleton — a cold cache leaves
  // `data` undefined here too, and deciding kind on undefined data is the bug
  // this guard exists to prevent.
  if (tenantQuery.isLoading) {
    return (
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2, px: 4, py: 3 }}>
        <Skeleton variant="rounded" sx={{ height: 48, width: "33.333%" }} />
        <Skeleton variant="rounded" sx={{ height: 128, width: "100%" }} />
      </Box>
    );
  }

  if (tenantQuery.isError || !tenantQuery.data) {
    return (
      <Box sx={{ px: 4, py: 3 }}>
        <ErrorState title="Failed to load tenant" message={(tenantQuery.error as Error)?.message} />
      </Box>
    );
  }

  if (tenantQuery.data.kind !== "external") {
    return (
      <Box sx={{ px: 4, py: 3 }} data-testid="integrations-not-available">
        <ErrorState
          title="Not available for this tenant"
          message="API keys are only available for external tenants."
        />
      </Box>
    );
  }

  return (
    <Box sx={{ px: 4, py: 3 }}>
      <ApiKeysPanel
        adapter={makeAdapter(tenantId)}
        queryKey={["tenant-api-keys", tenantId]}
        showSimulationBadge
      />
    </Box>
  );
}

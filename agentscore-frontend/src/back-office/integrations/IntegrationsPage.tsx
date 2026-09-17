/** IntegrationsPage — customer-facing API key management, admin-only.
 *
 * API keys authenticate the traces an agent sends to AgentScore. They belong
 * to an external tenant (an internal/sample tenant never gets one), so this
 * page has nothing to manage until at least one external tenant exists.
 *
 * Mounts the same shared `ApiKeysPanel` as the back-office tenant
 * Integrations tab (`TenantIntegrationsPage.tsx`), over the same
 * tenant-fixtures-backed adapter, scoped to whichever external tenant is
 * selected.
 */

import { useEffect, useState } from "react";
import { useFakeQuery as useQuery } from "@/back-office/agents/fake-query";
import Box from "@mui/material/Box";
import Skeleton from "@mui/material/Skeleton";

import * as tenantsApi from "@/back-office/tenants/tenant-fixtures";
import { makeAdapter } from "@/back-office/tenants/api-keys-adapter";
import { ApiKeysPanel } from "@/shared/components/api-keys/ApiKeysPanel";
import { Combobox } from "@/shared/components/combobox";
import { EmptyState } from "@/shared/components/empty-state";
import { ErrorState } from "@/shared/components/error-state";
import { PageBand } from "@/shared/components/page-band";
import { pageContentPaddingSx } from "@/shared/components/page-content";
import { PageHeader } from "@/shared/components/page-header";
import { ScrollRegion } from "@/shared/components/scroll-region";
import IconMaterialSymbolsKey from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsKey.mjs";
import { Link } from "@tanstack/react-router";
import Button from "@mui/material/Button";

// Customer-side keys are capped, unlike the uncapped admin/back-office mount
// of the same panel (`TenantIntegrationsPage.tsx`).
const MAX_KEYS = 20;

export function IntegrationsPage() {
  const tenantsQuery = useQuery({
    queryKey: ["tenants", "external"],
    queryFn: () => tenantsApi.listTenants({ kind: ["external"] }),
  });

  const externalTenants = tenantsQuery.data?.items ?? [];
  const [tenantId, setTenantId] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (tenantId || externalTenants.length === 0) return;
    setTenantId(externalTenants[0].tenant_id);
  }, [tenantId, externalTenants]);

  return (
    <Box sx={{ display: "flex", minHeight: 0, flex: 1, flexDirection: "column" }}>
      <PageBand sx={{ pt: 4, pb: 2.5 }}>
        <PageHeader
          title="Integrations"
          description="API keys authenticate the traces your agents send to AgentScore. Each key belongs to one tenant and can be disabled or rotated independently."
        />
      </PageBand>

      <ScrollRegion>
        <Box sx={pageContentPaddingSx}>
          {tenantsQuery.isLoading ? (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <Skeleton variant="rounded" sx={{ height: 40, width: "33.333%" }} />
              <Skeleton variant="rounded" sx={{ height: 160, width: "100%" }} />
            </Box>
          ) : tenantsQuery.isError ? (
            <ErrorState title="Failed to load tenants" message={(tenantsQuery.error as Error)?.message} />
          ) : externalTenants.length === 0 ? (
            <EmptyState
              icon={IconMaterialSymbolsKey}
              title="No tenant to hold a key"
              description="API keys belong to an external tenant, and this deployment has none yet. Create one from Tenants."
              action={
                <Button component={Link} to="/tenants/new" variant="contained">
                  Create a tenant
                </Button>
              }
              testId="integrations-empty"
            />
          ) : (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {externalTenants.length > 1 ? (
                <Box sx={{ maxWidth: 320 }}>
                  <Combobox
                    testId="integrations-tenant"
                    ariaLabel="Tenant"
                    options={externalTenants.map((t) => ({
                      value: t.tenant_id,
                      label: t.name,
                      description: t.env ?? undefined,
                      searchText: t.name,
                    }))}
                    value={tenantId}
                    onChange={setTenantId}
                    clearable={false}
                  />
                </Box>
              ) : null}
              {tenantId ? (
                <ApiKeysPanel
                  adapter={makeAdapter(tenantId)}
                  queryKey={["tenant-api-keys", tenantId]}
                  maxKeys={MAX_KEYS}
                />
              ) : null}
            </Box>
          )}
        </Box>
      </ScrollRegion>
    </Box>
  );
}

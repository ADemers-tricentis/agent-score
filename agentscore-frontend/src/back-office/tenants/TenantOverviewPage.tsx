/** TenantOverviewPage — landing tab of the tenant detail sub-app.
 *
 * Agent totals and provisioning above top agents and tenant identity.
 */

import { useMemo } from "react";
import { useFakeQuery as useQuery } from "@/back-office/agents/fake-query";
import { Link, useParams } from "@tanstack/react-router";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Grid from "@mui/material/Grid";
import Skeleton from "@mui/material/Skeleton";
import IconMaterialSymbolsSmartToy from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsSmartToy.mjs";

import { FAKE_AGENTS, type FakeAgent } from "@/back-office/agents/fake-data";
import * as api from "@/back-office/tenants/tenant-fixtures";
import { Chip } from "@/shared/components/chip";
import { EmptyState } from "@/shared/components/empty-state";
import { ErrorState } from "@/shared/components/error-state";
import { ProvenanceDl } from "@/shared/components/provenance-dl";
import { StatCard } from "@/shared/components/stat-card";
import { StatusDot } from "@/shared/components/status-dot";

/** Rows this card fetches. It is a SAMPLE, not the tenant's agent count — the
 *  card renders five rows and the provisioning breakdown is derived from this
 *  page, so the page size has to be visible to the copy that describes it. */
const AGENT_SAMPLE_SIZE = 50;

/** Rows the "Top agents" panel lists. */
const TOP_AGENT_ROWS = 5;

export function TenantOverviewPage() {
  const { tenantId } = useParams({ strict: false }) as { tenantId: string };

  const tenantQuery = useQuery({
    queryKey: ["tenant", tenantId],
    queryFn: () => api.getTenant(tenantId),
  });

  const agentsQuery = useQuery({
    queryKey: ["agents-for-tenant", tenantId],
    queryFn: () => {
      const items = FAKE_AGENTS.filter((a) => a.tenant_id === tenantId).slice(0, AGENT_SAMPLE_SIZE);
      const total = FAKE_AGENTS.filter((a) => a.tenant_id === tenantId).length;
      return Promise.resolve({ items, total });
    },
  });

  const tenant = tenantQuery.data;
  const allAgents = agentsQuery.data?.items ?? [];
  const liveAgents = allAgents.filter((a) => !a.deleted_at);
  // The server's own count of the tenant's live agents — `listAgents` sends
  // `include_deleted=false`, so `total` and `items` describe the same set. This
  // is what the Agents tile and the "Showing N of M" caption must read, not
  // `liveAgents.length`: a tenant with 300 agents was reporting 50 everywhere.
  const totalAgents = agentsQuery.data?.total ?? liveAgents.length;
  // Per-status counts over the WHOLE tenant, not the fetched sample.
  const statusCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const a of FAKE_AGENTS.filter((x) => x.tenant_id === tenantId && !x.deleted_at)) {
      counts.set(a.provisioning_status, (counts.get(a.provisioning_status) ?? 0) + 1);
    }
    return counts;
  }, [tenantId]);
  const provisioning = statusCounts.get("provisioning") ?? 0;
  const failed = statusCounts.get("failed") ?? 0;
  const active = statusCounts.get("active") ?? 0;
  // No tile-level sample caveat any more: the tiles count the whole tenant. The
  // five-row agent card keeps its own "Showing N of M" caption below.

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5, px: 4, py: 3 }}>
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 6, lg: 6 }}>
          <StatCard
            label="Agents"
            icon={IconMaterialSymbolsSmartToy}
            value={
              agentsQuery.isLoading ? "…" : (
                <Box component="span" data-testid="tenant-agents-total">
                  {totalAgents.toLocaleString()}
                </Box>
              )
            }
            hint={
              agentsQuery.isLoading ? undefined : (
                <Box component="span" data-testid="tenant-agents-hint">
                  {active} active · {totalAgents - active} dormant
                </Box>
              )
            }
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 6 }}>
          <StatCard
            label="Provisioning"
            value={
              agentsQuery.isLoading ? "…" : (
                <Box
                  component="span"
                  data-testid="tenant-provisioning-active"
                  sx={{ display: "inline-flex", alignItems: "baseline", gap: 0.5 }}
                >
                  {active}
                  <Box
                    component="span"
                    sx={{
                      typography: "caption",
                      color: "success.main",
                    }}
                  >
                    active
                  </Box>
                </Box>
              )
            }
            hint={
              agentsQuery.isLoading ? undefined : (
                <Box component="span" data-testid="tenant-provisioning-hint">
                  {provisioning > 0 || failed > 0 ? (
                    <>
                      {provisioning > 0 ? (
                        <Box component="span" sx={{ color: "warning.main" }}>
                          {provisioning} provisioning
                        </Box>
                      ) : null}
                      {provisioning > 0 && failed > 0 ? " · " : null}
                      {failed > 0 ? (
                        <Box component="span" sx={{ color: "error.main" }}>
                          {failed} failed
                        </Box>
                      ) : null}
                    </>
                  ) : (
                    "All agents active"
                  )}
                </Box>
              )
            }
          />
        </Grid>
      </Grid>

      <Grid container spacing={2.5}>
        <Grid size={{ xs: 12, lg: 8 }}>
          <Card>
            <CardContent>
              <Box sx={{ mb: 1.5 }}>
                <Box sx={{ typography: "body2", fontWeight: 600 }}>
                  Top agents in {tenant?.name ?? "this tenant"}
                </Box>
                <Box
                  data-testid="tenant-top-agents-caption"
                  sx={{ typography: "caption", color: "text.secondary" }}
                >
                  {agentsQuery.isLoading
                    ? "Loading…"
                    : `Showing ${Math.min(liveAgents.length, TOP_AGENT_ROWS)} of ${totalAgents}`}
                </Box>
              </Box>
              {agentsQuery.isLoading ? (
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                  <Skeleton variant="rounded" sx={{ height: 16, width: "100%" }} />
                  <Skeleton variant="rounded" sx={{ height: 16, width: "75%" }} />
                  <Skeleton variant="rounded" sx={{ height: 16, width: "66.666%" }} />
                </Box>
              ) : agentsQuery.isError ? (
                <ErrorState
                  title="Failed to load agents"
                  message={(agentsQuery.error as Error)?.message}
                />
              ) : liveAgents.length === 0 ? (
                <EmptyState
                  icon={IconMaterialSymbolsSmartToy}
                  title="No agents yet"
                  description="Create an agent to start receiving traces."
                />
              ) : (
                <Box
                  component="ul"
                  sx={{
                    listStyle: "none",
                    m: 0,
                    p: 0,
                    typography: "body1",
                    "& > li + li": { borderTop: 1, borderColor: "divider" },
                  }}
                >
                  {liveAgents.slice(0, TOP_AGENT_ROWS).map((agent) => (
                    <Box
                      component="li"
                      key={agent.agent_id}
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        py: 1,
                      }}
                    >
                      <Box
                        sx={{
                          minWidth: 0,
                          "& a": {
                            fontWeight: 500,
                            color: "inherit",
                            textDecoration: "none",
                          },
                          "& a:hover": { textDecoration: "underline" },
                        }}
                      >
                        <Link
                          to="/tenants/$tenantId/agents/$agentId"
                          params={{ tenantId, agentId: agent.agent_id }}
                          search={{ sub: "run" }}
                        >
                          {agent.name}
                        </Link>
                        <Box
                          sx={{
                            fontFamily: "monospace",
                            typography: "caption",
                            color: "text.secondary",
                          }}
                        >
                          {agent.agent_id}
                        </Box>
                      </Box>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                        <ProvisioningChip agent={agent} />
                        <Box
                          component="span"
                          sx={{ typography: "caption", color: "text.secondary" }}
                        >
                          {new Date(agent.created_at).toLocaleDateString()}
                        </Box>
                      </Box>
                    </Box>
                  ))}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, lg: 4 }}>
          <Card>
            <CardContent>
              <Box sx={{ mb: 1.5, typography: "body2", fontWeight: 600 }}>
                Tenant details
              </Box>
              {tenantQuery.isLoading ? (
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                  <Skeleton variant="rounded" sx={{ height: 16, width: "66.666%" }} />
                  <Skeleton variant="rounded" sx={{ height: 16, width: "50%" }} />
                  <Skeleton variant="rounded" sx={{ height: 16, width: "75%" }} />
                </Box>
              ) : tenantQuery.isError ? (
                <ErrorState
                  title="Failed to load tenant"
                  message={(tenantQuery.error as Error)?.message}
                />
              ) : tenant ? (
                <ProvenanceDl
                  columns={1}
                  items={[
                    {
                      label: "Kind",
                      value: (
                        <Chip tint={tenant.kind === "internal" ? "info" : "muted"}>
                          {tenant.kind}
                        </Chip>
                      ),
                    },
                    { label: "Environment", value: tenant.env ?? "—" },
                    {
                      label: "Tenant id",
                      value: (
                        <Box
                          component="span"
                          sx={{ fontFamily: "monospace", typography: "caption" }}
                        >
                          {tenant.tenant_id}
                        </Box>
                      ),
                    },
                    {
                      label: "Created",
                      value: new Date(tenant.created_at).toLocaleString(),
                    },
                  ]}
                />
              ) : null}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}

// Only ever called with `liveAgents` (deleted filtered out by the caller), so
// no deleted branch here.
function ProvisioningChip({ agent }: { agent: FakeAgent }) {
  if (agent.provisioning_status === "active") {
    return <StatusDot status="success">active</StatusDot>;
  }
  if (agent.provisioning_status === "provisioning") {
    return (
      <StatusDot status="warning" pulse>
        provisioning
      </StatusDot>
    );
  }
  return <StatusDot status="destructive">failed</StatusDot>;
}

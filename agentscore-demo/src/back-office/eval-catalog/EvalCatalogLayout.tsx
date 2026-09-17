/** EvalCatalogLayout — shell for the global Evals Catalog sub-app.
 *
 * Renders an EntityShell with one "Evals Catalog" title and a tab strip
 * (Evals / Dimensions / Profiles) so the taxonomy + profiles
 * surfaces are reachable by clicking. Each list route renders
 * into `<Outlet />` below the shell chrome. The catalog is global and
 * superadmin-only; non-superadmins get the access-required message (the gate
 * also lives here so the tab bar never renders for non-superadmins).
 *
 * The drill-down / builder routes (eval detail, eval author,
 * profile builder) stay standalone outside this layout — they have their own
 * breadcrumbs back to the list, mirroring tenant create/detail.
 */

import { Outlet } from "@tanstack/react-router";

import { CatalogCreateMenu } from "@/back-office/eval-catalog/CatalogCreateMenu";
import {
  EntityShell,
  type EntityShellTabItem,
} from "@/shared/components/entity-shell";

const TABS: EntityShellTabItem[] = [
  { id: "evals", label: "Evals", to: "/evals/catalog/evals" },
  { id: "dimensions", label: "Dimensions", to: "/evals/catalog/dimensions" },
  { id: "profiles", label: "Profiles", to: "/evals/catalog/profiles" },
];

export function EvalCatalogLayout() {
  return (
    <EntityShell
      title="Evals Catalog"
      description="The checks and scoring recipes used to grade your agents' answers."
      actions={<CatalogCreateMenu />}
      tabs={<EntityShell.Tabs items={TABS} />}
    >
      <Outlet />
    </EntityShell>
  );
}

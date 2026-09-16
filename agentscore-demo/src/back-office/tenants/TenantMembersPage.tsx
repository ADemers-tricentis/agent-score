/** TenantMembersPage — members table for one tenant.
 *
 * Placeholder for now. The members API isn't wired through to the FE yet —
 * once it is, this page becomes a `DataTable` with member rows + add /
 * remove / role-change actions (per the design ref).
 */

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import IconMaterialSymbolsGroup from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsGroup.mjs";
import IconMaterialSymbolsPersonAdd from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsPersonAdd.mjs";

import { EmptyState } from "@/shared/components/empty-state";

export function TenantMembersPage() {
  return (
    <Box sx={{ px: 4, py: 3 }}>
      <Card>
        <CardContent>
          <EmptyState
            icon={IconMaterialSymbolsGroup}
            title="Members coming soon"
            description="User ↔ tenant memberships, role assignments, and the add-member dialog land once the BE members API is wired through to the front-end."
            action={
              <Button
                variant="outlined"
                data-testid="add-member"
                disabled
                startIcon={<IconMaterialSymbolsPersonAdd />}
              >
                Add member
              </Button>
            }
          />
        </CardContent>
      </Card>
    </Box>
  );
}

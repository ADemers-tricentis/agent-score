import type { ReactNode } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";

interface EntityShellTabItem {
  label: string;
  value: string;
}

interface EntityShellProps {
  title: string;
  meta?: string;
  badges?: ReactNode;
  actions?: ReactNode;
  tabs?: { items: EntityShellTabItem[]; value: string; onChange: (value: string) => void };
  children: ReactNode;
  testId?: string;
}

// Mirrors the shape of production's `EntityShell` page chrome, minus its own
// in-page breadcrumb row - the demo already renders breadcrumbs in the
// topbar (see `Layout.tsx`'s `buildBreadcrumbs`), so this only owns title,
// badges, meta, actions, and an optional tab strip.
export default function EntityShell({ title, meta, badges, actions, tabs, children, testId }: EntityShellProps) {
  return (
    <Box data-testid={testId} sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <Box sx={{ px: 3, pt: 2.5, pb: 0, bgcolor: "background.paper" }}>
        <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 2, mb: 0.5 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, flexWrap: "wrap" }}>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>{title}</Typography>
            {badges}
          </Box>
          {actions && <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexShrink: 0 }}>{actions}</Box>}
        </Box>
        {meta && (
          <Typography variant="body2" sx={{ color: "text.secondary", mb: 2, maxWidth: 640 }}>
            {meta}
          </Typography>
        )}
        {tabs && (
          <Tabs
            value={tabs.value}
            onChange={(_, v) => tabs.onChange(v)}
            sx={{ minHeight: 36, "& .MuiTab-root": { minHeight: 36, fontSize: "0.85rem", textTransform: "none" } }}
          >
            {tabs.items.map((item) => (
              <Tab key={item.value} value={item.value} label={item.label} />
            ))}
          </Tabs>
        )}
      </Box>
      <Box sx={{ flex: 1, overflow: "auto", p: 3 }}>{children}</Box>
    </Box>
  );
}

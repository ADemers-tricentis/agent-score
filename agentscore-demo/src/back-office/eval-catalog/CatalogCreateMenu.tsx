/** Header-level "New ▾" create menu for the Evals Catalog.
 *
 *  Replaces the per-tab create buttons (New dimension / profile) with one
 *  button + dropdown rendered in the `EntityShell` header actions slot, so the
 *  catalog matches the other back-office pages' single header-action pattern.
 *  Each menu item keeps its original `new-{entity}-button` testid + route, so
 *  the create-action identity is preserved (just relocated). No "Eval" item:
 *  eval create/edit is API-only for now (the Studio it used to open is gone).
 */

import { useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import Button from "@mui/material/Button";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import type SvgIcon from "@mui/material/SvgIcon";
import IconMaterialSymbolsAdd from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsAdd.mjs";
import IconMaterialSymbolsKeyboardArrowDown from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsKeyboardArrowDown.mjs";
import IconMaterialSymbolsCategory from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsCategory.mjs";
import IconMaterialSymbolsLayers from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsLayers.mjs";

interface CreateItem {
  id: string;
  label: string;
  icon: typeof SvgIcon;
  testid: string;
  go: () => void;
}

export function CatalogCreateMenu() {
  const navigate = useNavigate();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);

  // Literal route strings stay inside each closure so TanStack's typed-route
  // navigate keeps its compile-time check (a stored `string` would lose it).
  const items: CreateItem[] = [
    {
      id: "dimension",
      label: "Dimension",
      icon: IconMaterialSymbolsCategory,
      testid: "new-dimension-button",
      go: () => void navigate({ to: "/evals/catalog/dimensions/new" }),
    },
    {
      id: "profile",
      label: "Profile",
      icon: IconMaterialSymbolsLayers,
      testid: "new-profile-button",
      go: () => void navigate({ to: "/evals/catalog/profiles/new" }),
    },
  ];

  return (
    <>
      <Button
        ref={triggerRef}
        variant="contained"
        data-testid="new-catalog-button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen(true)}
        startIcon={<IconMaterialSymbolsAdd sx={{ fontSize: 16 }} />}
        endIcon={<IconMaterialSymbolsKeyboardArrowDown sx={{ fontSize: 18 }} />}
      >
        New
      </Button>
      <Menu
        anchorEl={triggerRef.current}
        open={open}
        onClose={() => setOpen(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
      >
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <MenuItem
              key={item.id}
              data-testid={item.testid}
              onClick={() => {
                setOpen(false);
                item.go();
              }}
            >
              <ListItemIcon>
                <Icon sx={{ fontSize: 18 }} />
              </ListItemIcon>
              <ListItemText>{item.label}</ListItemText>
            </MenuItem>
          );
        })}
      </Menu>
    </>
  );
}

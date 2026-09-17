import IconMaterialSymbolsApartment from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsApartment.mjs";
import IconMaterialSymbolsDatabase from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsDatabase.mjs";
import IconMaterialSymbolsGroup from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsGroup.mjs";
import IconMaterialSymbolsSmartToy from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsSmartToy.mjs";

import type { CascadePreviewItem } from "./cascade-preview-list";
/**
 * What a hard purge of an AGENT destroys, in the order an operator cares about.
 *
 * Exported rather than written per dialog because there were three copies and
 * they disagreed with each other and with the code: none of them mentioned
 * the object-store payloads that `delete_trace_payloads` removes before the
 * database row is deleted — deliberately in that order, since the index row
 * is the only thing that knows a payload object exists.
 * One list means the entry points cannot drift apart again.
 */
export const AGENT_PURGE_CASCADE: CascadePreviewItem[] = [
  {
    icon: IconMaterialSymbolsSmartToy,
    label: "Agent row + every scoring result, run and card",
  },
  {
    icon: IconMaterialSymbolsDatabase,
    label: "Every stored trace: payload objects and index rows",
    hint: "(irreversible — the payload is the only copy)",
  },
];

/** What a hard purge of a TENANT destroys. See `AGENT_PURGE_CASCADE`. */
export const TENANT_PURGE_CASCADE: CascadePreviewItem[] = [
  {
    icon: IconMaterialSymbolsApartment,
    label: "Tenant row + all agent rows",
  },
  {
    icon: IconMaterialSymbolsGroup,
    label: "All member memberships",
    hint: "(users themselves remain)",
  },
  {
    icon: IconMaterialSymbolsDatabase,
    label: "Every agent's stored traces: payload objects and index rows",
    hint: "(irreversible — the payload is the only copy)",
  },
];

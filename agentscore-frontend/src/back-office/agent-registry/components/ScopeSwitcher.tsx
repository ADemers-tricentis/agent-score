/** Global-vs-tenant scope selector for the Agent Registry page (spec S14a §2
 *  "Global vs per-tenant: two page trees or one?"). Writes back through
 *  `onChange(tenantId | null)`; the caller reflects that into `?tenant=`.
 */

import { FAKE_TENANTS } from "@/back-office/agents/fake-data";
import { Combobox, type ComboboxOption } from "@/shared/components/combobox";

/** Sentinel for "no tenant" (Global scope). Tenant ids are ULIDs — 26
 *  uppercase Crockford-base32 characters, never lowercase and never an
 *  underscore — so this string can never collide with a real tenant id. */
const GLOBAL_SCOPE = "__global__";

interface ScopeSwitcherProps {
  tenantId: string | null;
  onChange: (tenantId: string | null) => void;
}

export function ScopeSwitcher({ tenantId, onChange }: ScopeSwitcherProps) {
  const options: ComboboxOption[] = [
    { value: GLOBAL_SCOPE, label: "Global" },
    ...FAKE_TENANTS.map((tenant) => ({
      value: tenant.tenant_id,
      label: tenant.name,
    })),
  ];

  return (
    <Combobox
      options={options}
      value={tenantId ?? GLOBAL_SCOPE}
      onChange={(value) =>
        onChange(value === undefined || value === GLOBAL_SCOPE ? null : value)
      }
      clearable={false}
      testId="registry-scope-picker"
      ariaLabel="Registry scope"
    />
  );
}

/** Maps `back-office/tenants/api.ts` onto the tenant-free `ApiKeysAdapter` —
 *  the 409 name-collision create/rename can throw (as `ApiKeyNameConflictError`)
 *  becomes `NameConflictError`, the shape the panel understands without
 *  knowing which app it's running in. Split out of `TenantSettingsPage.tsx`
 *  so that module only exports the page component
 *  (`react-refresh/only-export-components`) — plain logic, independently
 *  tested, has earned its own file, mirroring
 *  `customer/integrations/adapter.ts`.
 *
 *  `back-office/tenants/api.ts` matches a bare `result.response.status === 409`
 *  with no code check at all — there is no cap route on the admin side to
 *  disambiguate from, unlike the customer app's create route. That is safe
 *  only while the admin API-key route stays uncapped.
 */

import * as api from "@/back-office/tenants/tenant-fixtures";
import { ApiKeyNameConflictError, type TenantApiKeyProfile } from "@/back-office/tenants/tenant-fixtures";
import {
  NameConflictError,
  type ApiKeyRow,
  type ApiKeysAdapter,
} from "@/shared/components/api-keys/types";

function toRow(key: TenantApiKeyProfile): ApiKeyRow {
  return {
    api_key_id: key.api_key_id,
    name: key.name,
    tk_display: key.tk_display,
    created_at: key.created_at,
    disabled_at: key.disabled_at ?? null,
    last_used_at: key.last_used_at ?? null,
    is_simulation: key.is_simulation,
  };
}

export function makeAdapter(tenantId: string): ApiKeysAdapter {
  return {
    list: async () => {
      const res = await api.listTenantApiKeys(tenantId);
      return res.items.map(toRow);
    },
    create: async (name) => {
      try {
        const res = await api.createTenantApiKey(tenantId, name);
        return { row: toRow(res.api_key), secret: res.tk };
      } catch (err) {
        if (err instanceof ApiKeyNameConflictError) {
          throw new NameConflictError();
        }
        throw err;
      }
    },
    rename: async (apiKeyId, name) => {
      try {
        const updated = await api.updateTenantApiKey(tenantId, apiKeyId, { name });
        return toRow(updated);
      } catch (err) {
        if (err instanceof ApiKeyNameConflictError) {
          throw new NameConflictError();
        }
        throw err;
      }
    },
    setDisabled: async (apiKeyId, disabled) => {
      const updated = await api.updateTenantApiKey(tenantId, apiKeyId, { disabled });
      return toRow(updated);
    },
    rotate: async (apiKeyId) => {
      const res = await api.rotateTenantApiKey(tenantId, apiKeyId);
      return { row: toRow(res.api_key), secret: res.tk };
    },
    revoke: async (apiKeyId) => {
      await api.revokeTenantApiKey(tenantId, apiKeyId);
    },
  };
}

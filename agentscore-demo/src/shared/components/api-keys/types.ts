/** Shared shape for `ApiKeysPanel` (spec `customer-api-key-self-service`).
 *
 * `ApiKeyRow` is the row projection both apps render — a superset the
 * back-office adapter maps its `TenantApiKeyProfile` onto and a subset the
 * customer adapter maps its `CustomerTenantApiKey` onto directly.
 * `is_simulation` is optional because the customer API never returns it (the
 * customer list route filters simulation keys server-side).
 *
 * Every `ApiKeysAdapter` method is tenant-free: each app constructs its
 * adapter with the tenant id already closed over, so the panel never takes,
 * holds or passes one. A `tenantId` parameter threaded through these methods
 * is the shape to avoid — it would sit on a component that has no other use
 * for it.
 */

export interface ApiKeyRow {
  api_key_id: string;
  name: string;
  tk_display: string;
  created_at: string;
  disabled_at: string | null;
  last_used_at: string | null;
  is_simulation?: boolean;
}

export interface ApiKeysAdapter {
  list: () => Promise<ApiKeyRow[]>;
  create: (name: string) => Promise<{ row: ApiKeyRow; secret: string }>;
  rename: (apiKeyId: string, name: string) => Promise<ApiKeyRow>;
  setDisabled: (apiKeyId: string, disabled: boolean) => Promise<ApiKeyRow>;
  rotate: (apiKeyId: string) => Promise<{ row: ApiKeyRow; secret: string }>;
  revoke: (apiKeyId: string) => Promise<void>;
}

/** Thrown by an adapter when create/rename collides with an existing name in
 *  the tenant. The panel renders this as a field error on the name input
 *  rather than a toast; every other rejection goes to a toast. Each app's
 *  `api.ts` throws a different shape for its own 409 (a bare `Error` in the
 *  back office, a `CustomerApiError` carrying `status` in the customer app),
 *  so normalising to this at the adapter is what keeps the panel itself free
 *  of per-app branching. */
export class NameConflictError extends Error {
  constructor(
    message = "A key with this name already exists in this tenant.",
  ) {
    super(message);
    this.name = "NameConflictError";
  }
}

/** Thrown by an adapter when the server rejects the name itself for a reason
 *  other than a conflict — e.g. the length validation on `name` (1–63
 *  characters on both the admin and customer create/rename routes). Routed
 *  to the same field-error surface as `NameConflictError`: a problem with
 *  the name belongs on the name field, not a toast, and the field is where
 *  the user is looking when either rejection lands. Carries the server's
 *  own message rather than a default, since "already exists" would be
 *  factually wrong here. */
export class InvalidNameError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidNameError";
  }
}

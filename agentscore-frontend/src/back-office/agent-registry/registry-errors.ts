/** Plain-language explanations for the refusal codes the agent-registry
 *  admin API can return (spec S14a §2, §4 "Every refusal code has an
 *  explanation").
 *
 * The server's own `message` is always shown alongside whatever this map
 * returns — it ADDS an explanation of what the code means and what to do
 * next, never replaces the server text, and never invents an explanation for
 * a code it doesn't recognize (`explainRegistryError` returns `null` then).
 */

export const REGISTRY_ERROR_CODES = [
  "slot_unknown",
  "tool_unknown",
  "tool_not_in_slot_allowlist",
  "write_tool_on_read_only_slot",
  "output_contract_invalid",
  "execution_limits_invalid",
  "version_tenant_mismatch",
  "version_revoked",
  "version_not_found",
  "version_number_conflict",
  "version_slot_mismatch",
  "base_version_invalid",
  "binding_conflict",
] as const;

export type RegistryErrorCode = (typeof REGISTRY_ERROR_CODES)[number];

const EXPLANATIONS: Record<RegistryErrorCode, string> = {
  slot_unknown: "This slug does not match any task slot. Check the slot slug and try again.",
  tool_unknown:
    "One of the named tools isn't registered at all. Remove it from the tool list before publishing.",
  tool_not_in_slot_allowlist:
    "This tool exists but this slot doesn't permit it. Pick a tool from the slot's own allowlist.",
  write_tool_on_read_only_slot:
    "This slot is read-only and the version names a tool that can write. Remove that tool or choose a read-only one.",
  output_contract_invalid:
    "This slot's own output contract doesn't parse as valid JSON Schema — that's a slot-definition problem, not something to fix on the version.",
  execution_limits_invalid:
    "Turn and wall-clock limits must be positive integers. Publish a replacement version with valid limits, or leave them empty to use defaults.",
  version_tenant_mismatch:
    "This version belongs to neither this tenant nor the global scope. Pick a version from the current scope.",
  version_revoked:
    "This version has been revoked and can't be bound. Publish a new version and bind that instead.",
  version_not_found: "This version no longer exists. Refresh the list and pick another.",
  version_number_conflict:
    "Another create request already took the next version number. Retry the create.",
  version_slot_mismatch:
    "This version belongs to a different slot. Pick a version that belongs to the slot you're editing.",
  base_version_invalid:
    "The version you copied from isn't a version of this slot owned by this tenant or global. Pick a different source version.",
  binding_conflict:
    "A concurrent binding write for this slot already went through. Reload the slot and retry.",
};

export function explainRegistryError(code: string): string | null {
  return (EXPLANATIONS as Record<string, string>)[code] ?? null;
}

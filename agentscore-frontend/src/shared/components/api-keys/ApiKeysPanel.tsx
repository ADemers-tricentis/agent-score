/** ApiKeysPanel — the entire ingest API-key management UI, shared by the
 *  customer Integrations page and the back-office tenant Settings tab's
 *  Integrations section (spec `customer-api-key-self-service`, "Is the panel
 *  built twice?" — no, once here, mounted by both apps over their own adapter).
 *
 *  Built to `integrations-page-mock.html`: table with inline rename, a status
 *  switch, per-row rotate/revoke, one-time secret reveal, create/rotate/
 *  disable/revoke dialogs, an empty state and an optional key-cap banner.
 *
 *  Create and Rotate lock while an unread secret is on screen; Revoke and the
 *  status switch do not, matching the mock. Disabling the last *active* key
 *  asks for confirmation first (an instant toggle has nowhere to put a
 *  warning); re-enabling never confirms. Rotate and Revoke always open their
 *  dialog and show the "only active key" warning inside it when applicable.
 *  "Last active" is derived from the list already in hand — no server field.
 */

import { useCallback, useRef, useState, type ReactNode } from "react";
import { useFakeMutation as useMutation, useFakeQuery as useQuery, useFakeQueryClient as useQueryClient } from "@/back-office/agents/fake-query";

type QueryKey = readonly unknown[];
import type { CellContext, ColumnDef } from "@tanstack/react-table";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import IconButton from "@mui/material/IconButton";
import Switch from "@mui/material/Switch";
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { alpha, type Theme } from "@mui/material/styles";
import type { InputHTMLAttributes } from "react";
import IconMaterialSymbolsAdd from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsAdd.mjs";
import IconMaterialSymbolsAutorenew from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsAutorenew.mjs";
import IconMaterialSymbolsCheck from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsCheck.mjs";
import IconMaterialSymbolsClose from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsClose.mjs";
import IconMaterialSymbolsDelete from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsDelete.mjs";
import IconMaterialSymbolsEdit from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsEdit.mjs";
import IconMaterialSymbolsError from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsError.mjs";
import IconMaterialSymbolsKey from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsKey.mjs";
import IconMaterialSymbolsWarning from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsWarning.mjs";

import {
  InvalidNameError,
  NameConflictError,
  type ApiKeyRow,
  type ApiKeysAdapter,
} from "@/shared/components/api-keys/types";
import { Chip } from "@/shared/components/chip";
import { DataTable } from "@/shared/components/data-table";
import { OneTimeSecretBanner } from "@/shared/components/OneTimeSecretBanner";
import { TypedConfirmInput } from "@/shared/components/typed-confirm-input";
import { fmtRelative } from "@/shared/format/relative";
import { toast } from "@/shared/lib/toast";
import { focusRing } from "@/shared/theme/focus-ring";
import { visuallyHidden } from "@/shared/theme/visually-hidden";

export interface ApiKeysPanelProps {
  /** Tenant-free CRUD surface — the caller closes over its own tenant id. */
  adapter: ApiKeysAdapter;
  /** react-query key for the list read. Rebuild it (and the adapter) when the
   *  caller's own tenant selection changes, or the panel keeps serving the
   *  previous tenant's cached keys. */
  queryKey: QueryKey;
  /** Shows the `Simulation` chip on a key the adapter marks as one. The
   *  customer surface never receives simulation keys, so it omits this. */
  showSimulationBadge?: boolean;
  /** When supplied, the cap banner (and the create-button lock) fires once
   *  the list reaches this many keys. Omitted on the back-office mount,
   *  which is uncapped. */
  maxKeys?: number;
}

// Matches `name`'s `Field(min_length=1, max_length=63)` on both the admin
// and customer create/rename routes. A client-side check tells the user
// before they submit; it does not replace the server rejection, which the
// adapter still maps to `InvalidNameError` and this same field surfaces.
const MAX_NAME_LENGTH = 63;

type Tone = "success" | "warning" | "error";

const CALLOUT_ICON: Record<Tone, typeof IconMaterialSymbolsWarning> = {
  success: IconMaterialSymbolsKey,
  warning: IconMaterialSymbolsWarning,
  error: IconMaterialSymbolsError,
};

/** Tinted-callout convention shared with `access-denied` / `OneTimeSecretBanner`
 *  — inlined here rather than promoted to `shared/components` since this file
 *  is its only caller. */
function Callout({
  tone,
  title,
  children,
}: {
  tone: Tone;
  title?: ReactNode;
  children: ReactNode;
}) {
  const Icon = CALLOUT_ICON[tone];
  return (
    <Box
      role="alert"
      sx={(theme: Theme) => ({
        display: "flex",
        gap: 1.5,
        p: 2,
        borderRadius: 1,
        border: 1,
        borderColor: theme.palette[tone].main,
        bgcolor: alpha(theme.palette[tone].main, tone === "warning" ? 0.12 : 0.1),
      })}
    >
      <Icon
        sx={(theme: Theme) => ({
          fontSize: 20,
          flexShrink: 0,
          mt: 0.25,
          color: theme.palette[tone].main,
        })}
      />
      <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5, minWidth: 0 }}>
        {title ? (
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            {title}
          </Typography>
        ) : null}
        <Typography variant="body2">{children}</Typography>
      </Box>
    </Box>
  );
}

function LastUsedCell({ row }: { row: ApiKeyRow }) {
  if (!row.last_used_at) {
    return (
      <Box component="span" sx={{ color: "text.secondary" }}>
        Never used
      </Box>
    );
  }
  return (
    <Tooltip title={new Date(row.last_used_at).toLocaleString()}>
      <Box component="span">{fmtRelative(row.last_used_at)}</Box>
    </Tooltip>
  );
}

interface NameCellProps {
  row: ApiKeyRow;
  showSimulationBadge: boolean;
  renaming: boolean;
  draft: string;
  error: string | null;
  onStart: () => void;
  onDraftChange: (value: string) => void;
  onSave: () => void;
  onCancel: () => void;
}

function NameCell({
  row,
  showSimulationBadge,
  renaming,
  draft,
  error,
  onStart,
  onDraftChange,
  onSave,
  onCancel,
}: NameCellProps) {
  if (renaming) {
    return (
      <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
          <TextField
            autoFocus
            size="small"
            fullWidth
            value={draft}
            error={Boolean(error)}
            onChange={(e) => onDraftChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") onSave();
              if (e.key === "Escape") onCancel();
            }}
            slotProps={{
              htmlInput: {
                "aria-label": `Rename ${row.name}`,
                "data-testid": `rename-input-${row.api_key_id}`,
                autoComplete: "off",
              },
            }}
          />
          <IconButton
            size="small"
            color="primary"
            aria-label="Save name"
            data-testid={`rename-save-${row.api_key_id}`}
            onClick={onSave}
          >
            <IconMaterialSymbolsCheck sx={{ fontSize: 16 }} />
          </IconButton>
          <IconButton
            size="small"
            aria-label="Cancel rename"
            data-testid={`rename-cancel-${row.api_key_id}`}
            onClick={onCancel}
          >
            <IconMaterialSymbolsClose sx={{ fontSize: 16 }} />
          </IconButton>
        </Box>
        {error ? (
          <Typography variant="caption" sx={{ color: "error.main" }}>
            {error}
          </Typography>
        ) : null}
      </Box>
    );
  }
  return (
    <Box sx={{ minWidth: 0 }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, minWidth: 0 }}>
        <Box
          component="button"
          type="button"
          data-testid={`rename-key-${row.api_key_id}`}
          onClick={onStart}
          sx={[
            focusRing,
            {
              display: "inline-flex",
              alignItems: "center",
              gap: 0.5,
              minWidth: 0,
              border: 0,
              background: "none",
              p: 0,
              font: "inherit",
              fontWeight: 500,
              color: "inherit",
              cursor: "text",
              textAlign: "left",
            },
          ]}
        >
          <Box
            component="span"
            sx={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
          >
            {row.name}
          </Box>
          <IconMaterialSymbolsEdit sx={{ fontSize: 14, color: "text.secondary", flexShrink: 0 }} />
        </Box>
        {showSimulationBadge && row.is_simulation ? (
          <Chip tint="info" data-testid={`key-simulation-${row.api_key_id}`}>
            Simulation
          </Chip>
        ) : null}
      </Box>
      <Box sx={{ fontFamily: "monospace", typography: "caption", color: "text.secondary" }}>
        {row.tk_display}
      </Box>
    </Box>
  );
}

/** Everything a column's `cell`/`header` render function reads that changes
 *  on a keystroke or a mutation settling. `columnDef.cell` is treated by
 *  `flexRender` as a component reference (any function qualifies, per
 *  `isReactComponent` in `@tanstack/react-table`) — a fresh arrow function
 *  passed as `cell` every render is therefore a *new component type* at that
 *  tree position, and React unmounts and remounts the whole cell subtree
 *  rather than updating it. That silently destroyed the inline-rename
 *  `TextField` (and every interactive cell) on every keystroke. The fix:
 *  each `cell`/`header` value below is a `useCallback` closed over an empty
 *  dependency array, so its identity never changes across renders; the data
 *  it needs on every call comes from this ref instead of the render's own
 *  closure, updated fresh on every render (read only from event handlers
 *  fired after the render commits — never during render itself). */
interface CellRuntime {
  renamingId: string | null;
  renameDraft: string;
  renameError: string | null;
  showSimulationBadge: boolean;
  locked: boolean;
  disablePending: boolean;
  startRename: (row: ApiKeyRow) => void;
  onRenameDraftChange: (value: string) => void;
  saveRename: (apiKeyId: string) => void;
  cancelRename: () => void;
  handleToggle: (row: ApiKeyRow) => void;
  openRotate: (row: ApiKeyRow) => void;
  openRevoke: (row: ApiKeyRow) => void;
}

export function ApiKeysPanel({
  adapter,
  queryKey,
  showSimulationBadge = false,
  maxKeys,
}: ApiKeysPanelProps) {
  const queryClient = useQueryClient();
  const runtimeRef = useRef<CellRuntime>(null as unknown as CellRuntime);

  // The revealed plaintext secret — local-only, never written to react-query.
  const [revealedSecret, setRevealedSecret] = useState<{ value: string; title: string } | null>(
    null,
  );
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [createError, setCreateError] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameDraft, setRenameDraft] = useState("");
  const [renameError, setRenameError] = useState<string | null>(null);
  // IDs, not row snapshots: the revoke gate compares the typed text against
  // the key's name, and rotate/disable name the key in their dialog title.
  // A snapshot captured at open time goes stale the moment a rename lands
  // (from this session's own list refresh or another one) while the dialog
  // is still open — the typed-name gate would then unlock on a name the key
  // no longer has, which is the entire safety mechanism for an irreversible,
  // server-side-unchecked delete. Deriving the target from the live list by
  // id on every render re-targets automatically; it never dismisses the
  // dialog on its own (a row that goes missing just makes the confirm
  // buttons below into no-ops, not an auto-close).
  const [rotateTargetId, setRotateTargetId] = useState<string | null>(null);
  const [revokeTargetId, setRevokeTargetId] = useState<string | null>(null);
  const [disableTargetId, setDisableTargetId] = useState<string | null>(null);

  const keysQuery = useQuery({ queryKey, queryFn: adapter.list });
  const rows = keysQuery.data ?? [];
  const invalidate = () => void queryClient.invalidateQueries({ queryKey });

  const rotateTarget = rows.find((r) => r.api_key_id === rotateTargetId) ?? null;
  const revokeTarget = rows.find((r) => r.api_key_id === revokeTargetId) ?? null;
  const disableTarget = rows.find((r) => r.api_key_id === disableTargetId) ?? null;

  const activeCount = rows.filter((r) => !r.disabled_at).length;
  const isLastActive = (row: ApiKeyRow) => !row.disabled_at && activeCount === 1;
  const capReached = maxKeys !== undefined && rows.length >= maxKeys;
  const locked = revealedSecret !== null;
  const trimmedNewName = newName.trim();
  const newNameTooLong = trimmedNewName.length > MAX_NAME_LENGTH;

  const openCreate = () => {
    setNewName("");
    setCreateError(null);
    setCreateOpen(true);
  };

  const createMutation = useMutation({
    mutationFn: (name: string) => adapter.create(name),
    onSuccess: ({ secret }) => {
      setRevealedSecret({ value: secret, title: "API key — copy now" });
      setCreateOpen(false);
      setNewName("");
      setCreateError(null);
      toast.success("API key created");
      invalidate();
    },
    onError: (err: Error) => {
      if (err instanceof NameConflictError || err instanceof InvalidNameError) {
        setCreateError(err.message);
      } else {
        toast.error(err.message);
      }
    },
  });

  const rotateMutation = useMutation({
    mutationFn: (apiKeyId: string) => adapter.rotate(apiKeyId),
    onSuccess: ({ row, secret }) => {
      setRevealedSecret({ value: secret, title: `API key "${row.name}" — copy now` });
      setRotateTargetId(null);
      toast.success("API key rotated");
      invalidate();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const setDisabledMutation = useMutation({
    mutationFn: ({ apiKeyId, disabled }: { apiKeyId: string; disabled: boolean }) =>
      adapter.setDisabled(apiKeyId, disabled),
    onError: (err: Error) => toast.error(err.message),
  });

  const applyDisabled = (row: ApiKeyRow, disabled: boolean, viaConfirm: boolean) => {
    setDisabledMutation.mutate(
      { apiKeyId: row.api_key_id, disabled },
      {
        onSuccess: () => {
          invalidate();
          if (disabled) {
            toast.success(
              viaConfirm ? "API key disabled — this tenant has no active key" : "API key disabled",
            );
          } else {
            toast.success("API key enabled");
          }
          if (viaConfirm) setDisableTargetId(null);
        },
      },
    );
  };

  const handleToggle = (row: ApiKeyRow) => {
    const turningOff = !row.disabled_at;
    if (turningOff && isLastActive(row)) {
      setDisableTargetId(row.api_key_id);
      return;
    }
    applyDisabled(row, turningOff, false);
  };

  const revokeMutation = useMutation({
    mutationFn: (apiKeyId: string) => adapter.revoke(apiKeyId),
    onSuccess: () => {
      setRevokeTargetId(null);
      toast.success("API key revoked");
      invalidate();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const renameMutation = useMutation({
    mutationFn: ({ apiKeyId, name }: { apiKeyId: string; name: string }) =>
      adapter.rename(apiKeyId, name),
    onSuccess: () => {
      setRenamingId(null);
      setRenameDraft("");
      setRenameError(null);
      toast.success("Key renamed");
      invalidate();
    },
    onError: (err: Error) => {
      if (err instanceof NameConflictError || err instanceof InvalidNameError) {
        setRenameError(err.message);
      } else {
        toast.error(err.message);
      }
    },
  });

  const startRename = (row: ApiKeyRow) => {
    setRenamingId(row.api_key_id);
    setRenameDraft(row.name);
    setRenameError(null);
  };
  const cancelRename = () => {
    setRenamingId(null);
    setRenameDraft("");
    setRenameError(null);
  };
  const saveRename = (apiKeyId: string) => {
    const name = renameDraft.trim();
    if (!name) {
      setRenameError("Name is required.");
      return;
    }
    if (name.length > MAX_NAME_LENGTH) {
      setRenameError(`Name must be ${MAX_NAME_LENGTH} characters or fewer (currently ${name.length}).`);
      return;
    }
    renameMutation.mutate({ apiKeyId, name });
  };

  // Reassigned every render (never read during render — only from the event
  // handlers inside the stable cell renderers below, after this commit). See
  // `CellRuntime`'s doc comment for why this indirection exists at all.
  runtimeRef.current = {
    renamingId,
    renameDraft,
    renameError,
    showSimulationBadge,
    locked,
    disablePending: setDisabledMutation.isPending,
    startRename,
    onRenameDraftChange: (value: string) => {
      setRenameDraft(value);
      if (renameError) setRenameError(null);
    },
    saveRename,
    cancelRename,
    handleToggle,
    openRotate: (row: ApiKeyRow) => setRotateTargetId(row.api_key_id),
    openRevoke: (row: ApiKeyRow) => setRevokeTargetId(row.api_key_id),
  };

  const nameCell = useCallback(({ row }: CellContext<ApiKeyRow, unknown>) => {
    const original = row.original;
    const rt = runtimeRef.current;
    const renaming = rt.renamingId === original.api_key_id;
    return (
      <NameCell
        row={original}
        showSimulationBadge={rt.showSimulationBadge}
        renaming={renaming}
        draft={rt.renameDraft}
        error={renaming ? rt.renameError : null}
        onStart={() => rt.startRename(original)}
        onDraftChange={rt.onRenameDraftChange}
        onSave={() => rt.saveRename(original.api_key_id)}
        onCancel={rt.cancelRename}
      />
    );
  }, []);

  const statusCell = useCallback(({ row }: CellContext<ApiKeyRow, unknown>) => {
    const key = row.original;
    const rt = runtimeRef.current;
    const disabled = Boolean(key.disabled_at);
    return (
      <Box sx={{ display: "inline-flex", alignItems: "center", gap: 1 }}>
        <Switch
          size="small"
          color="success"
          checked={!disabled}
          disabled={rt.disablePending}
          onChange={() => rt.handleToggle(key)}
          slotProps={{
            input: {
              "aria-label": `Status for ${key.name}`,
              "data-testid": `toggle-key-${key.api_key_id}`,
            } as InputHTMLAttributes<HTMLInputElement>,
          }}
        />
        <Typography variant="body2" sx={{ color: disabled ? "text.secondary" : "text.primary" }}>
          {disabled ? "Disabled" : "Active"}
        </Typography>
      </Box>
    );
  }, []);

  const createdCell = useCallback(
    ({ row }: CellContext<ApiKeyRow, unknown>) =>
      new Date(row.original.created_at).toLocaleDateString(),
    [],
  );

  const lastUsedCell = useCallback(
    ({ row }: CellContext<ApiKeyRow, unknown>) => <LastUsedCell row={row.original} />,
    [],
  );

  const actionsHeader = useCallback(() => <Box sx={visuallyHidden}>Actions</Box>, []);

  const actionsCell = useCallback(({ row }: CellContext<ApiKeyRow, unknown>) => {
    const key = row.original;
    const rt = runtimeRef.current;
    return (
      <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1 }}>
        <Button
          variant="outlined"
          size="small"
          data-testid={`rotate-key-${key.api_key_id}`}
          disabled={rt.locked}
          title={rt.locked ? "Copy and dismiss the visible secret first" : undefined}
          onClick={() => rt.openRotate(key)}
          startIcon={<IconMaterialSymbolsAutorenew sx={{ fontSize: 16 }} />}
        >
          Rotate
        </Button>
        <Button
          variant="outlined"
          size="small"
          color="error"
          data-testid={`revoke-key-${key.api_key_id}`}
          onClick={() => rt.openRevoke(key)}
          startIcon={<IconMaterialSymbolsDelete sx={{ fontSize: 16 }} />}
        >
          Revoke
        </Button>
      </Box>
    );
  }, []);

  const columns: ColumnDef<ApiKeyRow, unknown>[] = [
    {
      id: "name",
      header: "Name",
      meta: { headerSx: { width: "30%" } },
      cell: nameCell,
    },
    {
      id: "status",
      header: "Status",
      meta: { headerSx: { width: "16%" } },
      cell: statusCell,
    },
    {
      id: "created",
      header: "Created",
      meta: { headerSx: { width: "13%" } },
      cell: createdCell,
    },
    {
      id: "last-used",
      header: "Last used",
      meta: { headerSx: { width: "15%" } },
      cell: lastUsedCell,
    },
    {
      id: "actions",
      header: actionsHeader,
      meta: { headerSx: { width: "26%" } },
      cell: actionsCell,
    },
  ];

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <Box
        sx={{
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
          gap: 2,
        }}
      >
        <Box>
          {/* `component="h2"`: both hosts (the customer `PageHeader` and the
              back-office `EntityShell`) render an `h1` above this panel, so
              this must be the next level down — `variant` keeps the Aura h5
              visual scale, which is a separate axis from the semantic tag. */}
          <Typography variant="h5" component="h2" sx={{ m: 0 }}>
            API keys
          </Typography>
          {rows.length > 0 ? (
            <Typography variant="caption" sx={{ color: "text.secondary" }}>
              {rows.length} {rows.length === 1 ? "key" : "keys"} · {activeCount} active
            </Typography>
          ) : null}
        </Box>
        <Button
          variant="contained"
          disableElevation
          data-testid="new-key-button"
          disabled={locked || capReached}
          title={
            locked
              ? "Copy and dismiss the visible secret first"
              : capReached
                ? `This tenant has reached the ${maxKeys}-key limit`
                : undefined
          }
          onClick={openCreate}
          startIcon={<IconMaterialSymbolsAdd fontSize="small" />}
        >
          New key
        </Button>
      </Box>

      {revealedSecret ? (
        <OneTimeSecretBanner
          secret={revealedSecret.value}
          title={revealedSecret.title}
          description="This is the only time the full secret is shown. Copy it and store it somewhere safe; it cannot be retrieved again."
          onDismiss={() => setRevealedSecret(null)}
        />
      ) : null}

      {capReached ? (
        <Callout tone="warning" title="Key limit reached">
          This tenant has {maxKeys} API keys, the maximum. Revoke a key you no longer use before
          creating another.
        </Callout>
      ) : null}

      <DataTable
        columns={columns}
        data={rows}
        tableSx={{ tableLayout: "fixed" }}
        isLoading={keysQuery.isLoading}
        error={keysQuery.error as Error | null}
        getRowId={(k) => k.api_key_id}
        getRowTestId={(k) => `api-key-row-${k.api_key_id}`}
        enableSorting={false}
        emptyState={{
          icon: IconMaterialSymbolsKey,
          title: "No API keys",
          description:
            "When this tenant was set up, Agent Score created one API key automatically. It has since been revoked, so nothing can send traces right now. Create a new key to reconnect your integration — the secret is shown once, at creation.",
          action: (
            <Button
              variant="contained"
              disableElevation
              data-testid="new-key-button-empty"
              disabled={locked}
              title={locked ? "Copy and dismiss the visible secret first" : undefined}
              onClick={openCreate}
              startIcon={<IconMaterialSymbolsAdd fontSize="small" />}
            >
              New key
            </Button>
          ),
        }}
      />

      <Dialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        maxWidth="sm"
        fullWidth
        transitionDuration={0}
        aria-labelledby="create-key-dialog-title"
      >
        <DialogTitle id="create-key-dialog-title">New API key</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Give the key a name you will recognise later — for example the service or environment
            that will use it. The secret is generated for you and shown once.
          </DialogContentText>
          <TextField
            autoFocus
            id="new-key-name"
            label="Name"
            value={newName}
            onChange={(e) => {
              setNewName(e.target.value);
              if (createError) setCreateError(null);
            }}
            fullWidth
            size="small"
            error={Boolean(createError) || newNameTooLong}
            helperText={
              createError ??
              (newNameTooLong
                ? `Name must be ${MAX_NAME_LENGTH} characters or fewer (currently ${trimmedNewName.length}).`
                : undefined)
            }
            slotProps={{
              htmlInput: { "data-testid": "new-key-name-input" },
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button
            variant="outlined"
            data-testid="create-key-cancel"
            onClick={() => setCreateOpen(false)}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            disableElevation
            data-testid="create-key-confirm"
            disabled={!trimmedNewName || newNameTooLong || createMutation.isPending}
            onClick={() => createMutation.mutate(trimmedNewName)}
            startIcon={<IconMaterialSymbolsAdd fontSize="small" />}
          >
            Create key
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={rotateTarget !== null}
        onClose={() => setRotateTargetId(null)}
        maxWidth="sm"
        fullWidth
        transitionDuration={0}
        aria-labelledby="rotate-key-dialog-title"
      >
        <DialogTitle id="rotate-key-dialog-title">Rotate {rotateTarget?.name}?</DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <DialogContentText sx={{ m: 0 }}>
            A fresh secret is generated and{" "}
            <Box component="strong">the current one stops working immediately</Box>. Anything
            still sending with the old secret will start failing until you update it. The new
            secret is shown once.
          </DialogContentText>
          {rotateTarget && isLastActive(rotateTarget) ? (
            <Callout tone="warning">
              This is the only active key for this tenant. Until you update your integration with
              the new secret, <Box component="strong">no traces will be accepted</Box>.
            </Callout>
          ) : null}
        </DialogContent>
        <DialogActions>
          <Button
            variant="outlined"
            data-testid="rotate-key-cancel"
            onClick={() => setRotateTargetId(null)}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            disableElevation
            data-testid="rotate-key-confirm"
            disabled={rotateMutation.isPending}
            onClick={() => rotateTarget && rotateMutation.mutate(rotateTarget.api_key_id)}
            startIcon={<IconMaterialSymbolsAutorenew fontSize="small" />}
          >
            Rotate key
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={disableTarget !== null}
        onClose={() => setDisableTargetId(null)}
        maxWidth="sm"
        fullWidth
        transitionDuration={0}
        aria-labelledby="disable-key-dialog-title"
      >
        <DialogTitle id="disable-key-dialog-title">Disable {disableTarget?.name}?</DialogTitle>
        <DialogContent>
          <Callout tone="warning" title="This stops all ingestion for this tenant">
            It is the only active key. Once disabled, Agent Score rejects every trace this tenant
            sends until you re-enable it or create another key. Disabling is reversible.
          </Callout>
        </DialogContent>
        <DialogActions>
          <Button
            variant="outlined"
            data-testid="disable-key-cancel"
            onClick={() => setDisableTargetId(null)}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            disableElevation
            data-testid="disable-key-confirm"
            disabled={setDisabledMutation.isPending}
            onClick={() => disableTarget && applyDisabled(disableTarget, true, true)}
          >
            Disable key
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={revokeTarget !== null}
        onClose={() => setRevokeTargetId(null)}
        maxWidth="sm"
        fullWidth
        transitionDuration={0}
        aria-labelledby="revoke-key-dialog-title"
      >
        <DialogTitle id="revoke-key-dialog-title">Revoke {revokeTarget?.name}?</DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <Callout tone="error" title="This cannot be undone">
            The key is deleted permanently and anything using it stops authenticating
            immediately. To disable a key temporarily instead, use the status toggle.
          </Callout>
          {revokeTarget && isLastActive(revokeTarget) ? (
            <Callout tone="warning">
              This is the only active key for this tenant. Revoking it{" "}
              <Box component="strong">stops all ingestion</Box> until you create a new one.
            </Callout>
          ) : null}
          {revokeTarget ? (
            <TypedConfirmInput
              confirmText={revokeTarget.name}
              buttonLabel={
                <>
                  <IconMaterialSymbolsDelete sx={{ fontSize: 16, mr: 0.5 }} />
                  Revoke key
                </>
              }
              onConfirm={() => revokeMutation.mutate(revokeTarget.api_key_id)}
              busy={revokeMutation.isPending}
              testId="revoke-key"
            />
          ) : null}
        </DialogContent>
        <Box sx={{ display: "flex", justifyContent: "flex-start", px: 3, pb: 2 }}>
          <Button
            variant="text"
            data-testid="revoke-key-cancel"
            onClick={() => setRevokeTargetId(null)}
          >
            Cancel
          </Button>
        </Box>
      </Dialog>
    </Box>
  );
}

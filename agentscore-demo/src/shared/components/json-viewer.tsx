import { useEffect, useMemo, useState, type ReactNode } from "react";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import TextField from "@mui/material/TextField";
import { alpha } from "@mui/material/styles";
import IconMaterialSymbolsCheck from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsCheck.mjs";
import IconMaterialSymbolsContentCopy from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsContentCopy.mjs";
import IconMaterialSymbolsKeyboardArrowRight from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsKeyboardArrowRight.mjs";
import IconMaterialSymbolsSearch from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsSearch.mjs";
import IconMaterialSymbolsUnfoldLess from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsUnfoldLess.mjs";
import IconMaterialSymbolsUnfoldMore from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsUnfoldMore.mjs";

import { toast } from "@/shared/lib/toast";
import { focusRing } from "@/shared/theme/focus-ring";
import { createJsonPreview, type JsonPreviewValue } from "./json-preview";

interface JsonViewerProps {
  /** Any JSON-ish value. Strings that are themselves JSON are parsed (deep). */
  value: unknown;
  /** Depth auto-expanded by default. Default 1. */
  defaultExpandDepth?: number;
  className?: string;
}

/**
 * Collapsible JSON tree with search + filter. Objects/arrays expand and
 * collapse; a search box filters to matching keys / values (case-insensitive)
 * and highlights the hits. Strings that contain JSON are parsed recursively so
 * double-encoded payloads render as a tree, not an escaped blob.
 */
export function JsonViewer({
  value,
  defaultExpandDepth = 1,
  className,
}: JsonViewerProps) {
  const preview = useMemo(() => createJsonPreview(value), [value]);
  const parsed = preview.value;
  const [query, setQuery] = useState("");
  const [overrides, setOverrides] = useState<Record<string, boolean>>({});
  const [copied, setCopied] = useState(false);

  const q = query.trim().toLowerCase();

  const pretty = useMemo(() => JSON.stringify(parsed, null, 2), [parsed]);

  useEffect(() => {
    setOverrides({});
    setQuery("");
  }, [value]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(pretty);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
      toast.error("Could not copy JSON. Check clipboard permissions and try again.");
    }
  };

  const setAll = (open: boolean) => {
    const paths: Record<string, boolean> = {};
    collectContainerPaths(parsed, "$", paths, open);
    setOverrides(paths);
  };

  return (
    <Box
      data-slot="json-viewer"
      className={className}
      sx={{
        overflow: "hidden",
        borderRadius: 1,
        border: 1,
        borderColor: "divider",
        bgcolor: "background.paper",
      }}
    >
      <Box
        sx={(theme) => ({
          display: "flex",
          alignItems: "center",
          gap: 1,
          borderBottom: 1,
          borderColor: alpha(theme.palette.divider, 0.6),
          bgcolor: alpha(theme.palette.action.hover, 0.4),
          px: 1,
          py: 0.75,
        })}
      >
        <TextField
          placeholder="Search keys or values…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          size="small"
          sx={{ flex: 1, "& input": { typography: "caption" } }}
          slotProps={{
            htmlInput: { "data-testid": "json-viewer-search", "aria-label": "Search JSON" },
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <IconMaterialSymbolsSearch
                    sx={{ fontSize: 12, color: "text.secondary" }}
                  />
                </InputAdornment>
              ),
            },
          }}
        />
        <IconButton
          data-testid="json-viewer-expand-all"
          type="button"
          size="small"
          aria-label="Expand all"
          title="Expand all"
          onClick={() => setAll(true)}
        >
          <IconMaterialSymbolsUnfoldMore fontSize="small" />
        </IconButton>
        <IconButton
          data-testid="json-viewer-collapse-all"
          type="button"
          size="small"
          aria-label="Collapse all"
          title="Collapse all"
          onClick={() => setAll(false)}
        >
          <IconMaterialSymbolsUnfoldLess fontSize="small" />
        </IconButton>
        <IconButton
          data-testid="json-viewer-copy"
          data-copy-state={copied ? "copied" : "idle"}
          type="button"
          size="small"
          aria-label={preview.truncated ? "Copy preview" : "Copy JSON"}
          title={preview.truncated ? "Copy preview" : "Copy JSON"}
          onClick={() => void copy()}
        >
          {copied ? (
            <IconMaterialSymbolsCheck fontSize="small" />
          ) : (
            <IconMaterialSymbolsContentCopy fontSize="small" />
          )}
        </IconButton>
      </Box>

      <Box
        sx={{
          maxHeight: "28rem",
          overflow: "auto",
          px: 1.5,
          py: 1,
          fontFamily: "monospace",
          typography: "caption",
          lineHeight: 1.625,
        }}
      >
        {preview.truncated ? (
          <Box
            data-testid="json-viewer-truncated"
            sx={{ mb: 1, color: "warning.main", typography: "caption" }}
          >
            Preview truncated. Search, expand, and copy apply only to the preview.
          </Box>
        ) : null}
        <JsonNode
          k={null}
          value={parsed}
          path="$"
          depth={0}
          q={q}
          overrides={overrides}
          setOverrides={setOverrides}
          defaultExpandDepth={defaultExpandDepth}
        />
        {q && !subtreeMatches(parsed, null, q) ? (
          <Box sx={{ py: 1, color: "text.secondary" }}>No matches.</Box>
        ) : null}
      </Box>
    </Box>
  );
}

interface JsonNodeProps {
  k: string | null;
  value: JsonPreviewValue;
  path: string;
  depth: number;
  q: string;
  overrides: Record<string, boolean>;
  setOverrides: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  defaultExpandDepth: number;
}

function JsonNode({
  k,
  value,
  path,
  depth,
  q,
  overrides,
  setOverrides,
  defaultExpandDepth,
}: JsonNodeProps) {
  // Filtered out: this node neither matches nor contains a match.
  if (q && !subtreeMatches(value, k, q)) return null;

  const isArray = Array.isArray(value);
  const isObject = !isArray && value !== null && typeof value === "object";
  const isContainer = isArray || isObject;

  if (!isContainer) {
    return (
      <Box sx={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
        {k !== null ? (
          <>
            <JsonKey label={k} q={q} />
            <Box component="span" sx={{ color: "text.secondary" }}>
              :{" "}
            </Box>
          </>
        ) : null}
        <JsonLeaf value={value as null | boolean | number | string} q={q} />
      </Box>
    );
  }

  const entries: [string, JsonPreviewValue][] = isArray
    ? (value as JsonPreviewValue[]).map((v, i) => [String(i), v])
    : Object.entries(value as Record<string, JsonPreviewValue>);

  const open =
    q.length > 0
      ? true
      : (overrides[path] ?? depth < defaultExpandDepth);

  const toggle = () =>
    setOverrides((prev) => ({
      ...prev,
      [path]: !(prev[path] ?? depth < defaultExpandDepth),
    }));

  const open_ = isArray ? "[" : "{";
  const close = isArray ? "]" : "}";
  const count = entries.length;

  const visibleEntries = q
    ? entries.filter(([ck, cv]) => subtreeMatches(cv, ck, q))
    : entries;

  return (
    <Box>
      <Box sx={{ display: "flex", alignItems: "flex-start" }}>
        <Box
          component="button"
          type="button"
          onClick={toggle}
          aria-label={open ? "Collapse" : "Expand"}
          sx={[
            focusRing,
            {
              ml: -0.5,
              mr: 0.25,
              mt: 0.25,
              display: "inline-flex",
              width: 16,
              height: 16,
              flexShrink: 0,
              alignItems: "center",
              justifyContent: "center",
              border: 0,
              p: 0,
              cursor: "pointer",
              borderRadius: 0.5,
              bgcolor: "transparent",
              color: "text.secondary",
              "&:hover": { bgcolor: "action.hover", color: "text.primary" },
            },
          ]}
        >
          <IconMaterialSymbolsKeyboardArrowRight
            sx={{
              fontSize: 12,
              transition: "transform 150ms",
              transform: open ? "rotate(90deg)" : "none",
            }}
          />
        </Box>
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Box
            component="button"
            type="button"
            onClick={toggle}
            sx={[
              focusRing,
              {
                textAlign: "left",
                border: 0,
                p: 0,
                m: 0,
                font: "inherit",
                color: "inherit",
                cursor: "pointer",
                bgcolor: "transparent",
              },
            ]}
          >
            {k !== null ? (
              <>
                <JsonKey label={k} q={q} />
                <Box component="span" sx={{ color: "text.secondary" }}>
                  :{" "}
                </Box>
              </>
            ) : null}
            <Box component="span" sx={{ color: "text.secondary" }}>
              {open_}
            </Box>
            {!open ? (
              <Box component="span" sx={{ color: "text.secondary" }}>
                {" "}
                {count} {isArray ? "items" : "keys"} {close}
              </Box>
            ) : null}
          </Box>

          {open ? (
            <>
              <Box
                sx={{ borderLeft: 1, borderColor: "divider", pl: 1.5 }}
              >
                {visibleEntries.map(([ck, cv]) => (
                  <JsonNode
                    key={ck}
                    k={ck}
                    value={cv}
                    path={`${path}.${ck}`}
                    depth={depth + 1}
                    q={q}
                    overrides={overrides}
                    setOverrides={setOverrides}
                    defaultExpandDepth={defaultExpandDepth}
                  />
                ))}
              </Box>
              <Box component="span" sx={{ color: "text.secondary" }}>
                {close}
              </Box>
            </>
          ) : null}
        </Box>
      </Box>
    </Box>
  );
}

function JsonKey({ label, q }: { label: string; q: string }) {
  return (
    <Box component="span" sx={{ color: "primary.main" }}>
      {highlight(`"${label}"`, q)}
    </Box>
  );
}

function JsonLeaf({
  value,
  q,
}: {
  value: null | boolean | number | string;
  q: string;
}) {
  if (value === null)
    return (
      <Box component="span" sx={{ color: "text.secondary" }}>
        null
      </Box>
    );
  if (typeof value === "string")
    return (
      <Box
        component="span"
        sx={{
          wordBreak: "break-word",
          whiteSpace: "pre-wrap",
          color: "success.main",
        }}
      >
        {highlight(JSON.stringify(value), q)}
      </Box>
    );
  if (typeof value === "number")
    return (
      <Box component="span" sx={{ color: "primary.main" }}>
        {highlight(String(value), q)}
      </Box>
    );
  return (
    <Box component="span" sx={{ color: "warning.main" }}>
      {String(value)}
    </Box>
  );
}

/** Wrap case-insensitive matches of `q` in a highlight mark. */
function highlight(text: string, q: string): ReactNode {
  if (!q) return text;
  const lower = text.toLowerCase();
  const idx = lower.indexOf(q);
  if (idx === -1) return text;
  const parts: ReactNode[] = [];
  let cursor = 0;
  let from = idx;
  let key = 0;
  while (from !== -1) {
    parts.push(text.slice(cursor, from));
    parts.push(
      <Box
        component="mark"
        key={key++}
        sx={(theme) => ({
          borderRadius: 0.5,
          bgcolor: alpha(theme.palette.warning.main, 0.3),
          color: "text.primary",
        })}
      >
        {text.slice(from, from + q.length)}
      </Box>,
    );
    cursor = from + q.length;
    from = lower.indexOf(q, cursor);
  }
  parts.push(text.slice(cursor));
  return <>{parts}</>;
}

/** True when this node's key or value — or any descendant — matches `q`. */
function subtreeMatches(
  value: JsonPreviewValue,
  key: string | null,
  q: string,
): boolean {
  if (!q) return true;
  if (key !== null && key.toLowerCase().includes(q)) return true;
  if (value === null) return "null".includes(q);
  if (typeof value !== "object")
    return String(value).toLowerCase().includes(q);
  if (Array.isArray(value))
    return value.some((v, i) => subtreeMatches(v, String(i), q));
  return Object.entries(value as Record<string, JsonPreviewValue>).some(([k, v]) =>
    subtreeMatches(v, k, q),
  );
}

/** Walk every container path so Expand-/Collapse-all can set them at once. */
function collectContainerPaths(
  value: JsonPreviewValue,
  path: string,
  acc: Record<string, boolean>,
  open: boolean,
): void {
  const isArray = Array.isArray(value);
  const isObject = !isArray && value !== null && typeof value === "object";
  if (!isArray && !isObject) return;
  acc[path] = open;
  const entries: [string, JsonPreviewValue][] = isArray
    ? (value as JsonPreviewValue[]).map((v, i) => [String(i), v])
    : Object.entries(value as Record<string, JsonPreviewValue>);
  for (const [k, v] of entries) {
    collectContainerPaths(v, `${path}.${k}`, acc, open);
  }
}

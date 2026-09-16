/** DimensionCreatePage — author a new curated dimension.
 *
 * Superadmin-only. Mirrors the back-office create canon (TenantCreatePage):
 * a light top (back-link + title), a stack of `FormSection`s, and a bottom
 * Cancel / Create bar — distinct from the detail page's per-section saves.
 */

import { focusRing } from "@/shared/theme/focus-ring";
import { useMemo, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { toast } from "@/shared/lib/toast";
import Box from "@mui/material/Box";
import Breadcrumbs from "@mui/material/Breadcrumbs";
import Button from "@mui/material/Button";
import FormLabel from "@mui/material/FormLabel";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import BreadcrumbsItem from "@tricentis/aura/components/BreadcrumbsItem.js";
import IconMaterialSymbolsClose from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsClose.mjs";
import IconMaterialSymbolsSave from "@tricentis/mui-icons/material-symbols/IconMaterialSymbolsSave.mjs";

import { EVALS, createDimensionFixture } from "@/back-office/eval-catalog/eval-catalog-fixtures";
import { Chip } from "@/shared/components/chip";
import { FormSection } from "@/shared/components/form-section";
import { MultiSelect } from "@/shared/components/combobox";

export function DimensionCreatePage() {
  const navigate = useNavigate();

  const [slug, setSlug] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedEvalIds, setSelectedEvalIds] = useState<string[]>([]);
  const [isPending, setIsPending] = useState(false);

  const activeEvals = useMemo(() => EVALS.filter((e) => e.status === "active"), []);
  const evalOptions = useMemo(
    () => activeEvals.map((e) => ({ value: e.id, label: e.name })),
    [activeEvals],
  );
  const evalNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const e of activeEvals) map.set(e.id, e.name);
    return map;
  }, [activeEvals]);

  const create = {
    isPending,
    mutate: () => {
      setIsPending(true);
      setTimeout(() => {
        const created = createDimensionFixture({
          slug: slug.trim(),
          name: name.trim(),
          description: description.trim() || null,
        });
        if (selectedEvalIds.length > 0) {
          for (const id of selectedEvalIds) {
            const ev = EVALS.find((e) => e.id === id);
            if (ev && !ev.dimensionIds.includes(created.id)) ev.dimensionIds.push(created.id);
          }
        }
        setIsPending(false);
        toast.success(`Dimension "${created.name}" created`);
        void navigate({ to: "/evals/catalog/dimensions" });
      }, 300);
    },
  };

  const canCreate =
    slug.trim().length > 0 && name.trim().length > 0 && !create.isPending;

  return (
    <Box
      sx={{
        minHeight: 0,
        flex: 1,
        overflowY: "auto",
        px: 4,
        py: 3,
      }}
    >
      <Stack sx={{ maxWidth: 1024, gap: 3 }}>
        <Box>
          <Breadcrumbs data-slot="breadcrumb" aria-label="breadcrumb">
            <BreadcrumbsItem
              data-slot="breadcrumb-link"
              component={Link}
              to="/evals/catalog/evals"
              label="Catalog"
            />
            <BreadcrumbsItem
              data-slot="breadcrumb-link"
              component={Link}
              to="/evals/catalog/dimensions"
              label="Dimensions"
            />
            <Typography
              data-slot="breadcrumb-page"
              component="span"
              variant="body2"
              color="text.primary"
              aria-current="page"
            >
              New dimension
            </Typography>
          </Breadcrumbs>
          <Typography
            component="h1"
            variant="h3"
            sx={{
              mt: 1.5,
              fontWeight: 600,
              letterSpacing: "-0.025em",
            }}
          >
            New dimension
          </Typography>
          <Typography
            variant="subtitle1"
            sx={{ mt: 0.5, color: "text.secondary" }}
          >
            A curated grouping of evals. Assigning evals here is the same as
            setting the dimension on each eval.
          </Typography>
        </Box>

        <FormSection
          title="General"
          description="The slug is the stable identifier and is immutable once created."
        >
          <Box sx={{ display: "flex", flexDirection: "column", gap: 0.75 }}>
            <FormLabel htmlFor="dimension-slug" sx={{ typography: "subtitle1" }}>
              Slug <Box component="span" sx={{ color: "error.main" }}>*</Box>
            </FormLabel>
            <TextField
              id="dimension-slug"
              autoComplete="off"
              placeholder="e.g. tone"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              size="small"
              slotProps={{
                htmlInput: {
                  "data-testid": "dimension-slug",
                  sx: { fontFamily: "monospace" },
                },
              }}
            />
          </Box>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 0.75 }}>
            <FormLabel htmlFor="dimension-name" sx={{ typography: "subtitle1" }}>
              Name <Box component="span" sx={{ color: "error.main" }}>*</Box>
            </FormLabel>
            <TextField
              id="dimension-name"
              autoComplete="off"
              placeholder="e.g. Tone & Style"
              value={name}
              onChange={(e) => setName(e.target.value)}
              size="small"
              slotProps={{ htmlInput: { "data-testid": "dimension-name" } }}
            />
          </Box>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 0.75 }}>
            <FormLabel
              htmlFor="dimension-description"
              sx={{ typography: "subtitle1" }}
            >
              Description
            </FormLabel>
            <TextField
              multiline
              rows={2}
              placeholder="Optional — what this dimension captures."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              slotProps={{
                htmlInput: {
                  id: "dimension-description",
                  "data-testid": "dimension-description",
                },
              }}
            />
          </Box>
        </FormSection>

        <FormSection
          title="Evals"
          description="Optionally assign evals to this dimension now — you can change membership later."
        >
          <Box sx={{ display: "flex", flexDirection: "column", gap: 0.75 }}>
            <FormLabel sx={{ typography: "subtitle1" }}>Evals</FormLabel>
            <MultiSelect
              options={evalOptions}
              values={selectedEvalIds}
              onChange={setSelectedEvalIds}
              placeholder="Add evals…"
              triggerLabel="Add evals…"
              searchPlaceholder="Filter evals…"
              emptyLabel="No active evals."
            />
            {selectedEvalIds.length > 0 ? (
              <Box
                sx={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 0.75,
                  pt: 0.5,
                }}
              >
                {selectedEvalIds.map((id) => {
                  const label = evalNameById.get(id) ?? id;
                  return (
                    <Chip key={id} tint="info">
                      {label}
                      <Box
                        component="button"
                        type="button"
                        aria-label={`Remove ${label}`}
                        data-testid={`dimension-eval-remove-${id}`}
                        onClick={() =>
                          setSelectedEvalIds((prev) =>
                            prev.filter((x) => x !== id),
                          )
                        }
                        sx={[focusRing, {
                          display: "inline-flex",
                          alignItems: "center",
                          border: 0,
                          p: 0,
                          ml: 0.25,
                          mr: "-0.125rem",
                          borderRadius: 0.5,
                          background: "transparent",
                          color: "inherit",
                          cursor: "pointer",
                          opacity: 0.7,
                          "&:hover": { opacity: 1 },
                        }]}
                      >
                        <IconMaterialSymbolsClose sx={{ fontSize: 12 }} />
                      </Box>
                    </Chip>
                  );
                })}
              </Box>
            ) : (
              <Typography variant="caption" sx={{ pt: 0.5, color: "text.secondary" }}>
                No evals assigned yet.
              </Typography>
            )}
          </Box>
        </FormSection>

        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            gap: 1,
          }}
        >
          <Button
            variant="outlined"
            data-testid="cancel-dimension"
            onClick={() => void navigate({ to: "/evals/catalog/dimensions" })}
            disabled={create.isPending}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            data-testid="create-dimension-submit"
            disabled={!canCreate}
            onClick={() => create.mutate()}
            startIcon={<IconMaterialSymbolsSave fontSize="small" />}
          >
            Create dimension
          </Button>
        </Box>
      </Stack>
    </Box>
  );
}

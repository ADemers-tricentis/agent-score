/** Type-level guard, not a component — never rendered, asserts nothing at
 *  runtime.
 *
 * `CardGridProps`'s whole justification (card-grid.tsx) is that an
 * expand+navigate configuration is UNREPRESENTABLE — a caller can never mix
 * `onToggle` with `onItemClick`. Nothing in the build enforced that: this
 * repo's `tsconfig.json` `include` and the lint config both scope to `src`,
 * so a `@ts-expect-error` sitting in a `tests/**` file would be silently
 * inert. This fixture lives under `src` so `pnpm run typecheck` actually
 * evaluates it — if the union ever loosens enough to accept a mixed
 * configuration, the expected error stops occurring and `@ts-expect-error`
 * itself becomes a compile error ("Unused '@ts-expect-error' directive").
 *
 * Imported once, for side effects only, by `card-grid.test.tsx` — an
 * unimported module still type-checks under `tsc`, but the import keeps this
 * file from reading as dead code to anyone scanning callers.
 */
import type { CardGridProps } from "@/shared/components/card-grid";

interface FixtureItem {
  id: string;
}

// Freely inferred (no contextual type here) so the mismatch below reports on
// one line rather than scattering across each property.
const mixedExpandAndNavigateConfig = {
  items: [] as FixtureItem[],
  getItemId: (item: FixtureItem) => item.id,
  getItemTestId: (item: FixtureItem) => item.id,
  getItemLabel: (item: FixtureItem) => item.id,
  renderCard: () => null,
  renderDetail: () => null,
  openId: null,
  onToggle: () => {},
  onItemClick: () => {},
};

// @ts-expect-error — a config carrying BOTH `onToggle` (expand mode) and
// `onItemClick` (navigate mode) must be unrepresentable by `CardGridProps`.
// If this line stops erroring, the discriminated union has been loosened.
export const cardGridUnionStaysDiscriminated: CardGridProps<FixtureItem> =
  mixedExpandAndNavigateConfig;

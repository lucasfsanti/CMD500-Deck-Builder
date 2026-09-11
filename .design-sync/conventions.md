## Using this design system

This is CMD500 Deck Builder's real "Night Ledger" component set — a
Commander 500 (Magic: The Gathering) deck-building UI. It is **data-driven,
not decorative**: every component takes a real domain object as its prop,
never a generic string/children API. Build new screens by composing these
11 components with real `DeckCard` data, not by inventing markup.

### Setup: drag-and-drop context

`CardRow`, `CardVisualTile`, and `ZoneSection` call dnd-kit's
`useSortable`/`useDroppable` internally. Wrap any composition that includes
them in a dnd-kit `DndContext`, and wrap sibling rows/tiles in a
`SortableContext` with their real id list — without it, drag handles are
inert and you'll see console warnings:

```tsx
import { DndContext } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { ZoneSection } from "cmd500-design-system";

<DndContext>
  <ZoneSection zone="mainDeck" cards={deckCards} nameLanguage="pt" />
</DndContext>;
```

`ZoneSection` already wraps its own rows/tiles in per-group
`SortableContext`s — you only need the outer `DndContext`. A standalone
`CardRow`/`CardVisualTile` (outside `ZoneSection`) additionally needs its
own `SortableContext` with that card's id.

### The styling idiom: fixed classes + CSS custom properties

There are **no utility classes and no style props** (no `color=`, no
`variant=` beyond the few enumerated below). Each component renders a fixed
set of `c500-*` class names (e.g. `c500-card`, `c500-tile`, `c500-gauge`,
`c500-chart`) whose entire look comes from `--c500-*` CSS custom properties
defined on `:root`/`:host` in `styles.css`. **Reskin by changing token
values, never by adding classes.**

Key tokens (full table and rationale in `guidelines/night-ledger.md`):

| Token | Role |
|---|---|
| `--c500-text`, `--c500-text-soft`, `--c500-bg`, `--c500-bg-raised`, `--c500-line` | Text/surface/border base |
| `--c500-mana-w/u/b/r/g` | Mana-color identity; green also means "good/legal", red also means "bad/illegal" |
| `--c500-mana-gold` | Multicolor identity **and** the price/foil accent |
| `--c500-mana-c` / `--c500-mana-land` | Colorless vs. land (kept visually distinct) |
| `--c500-price` | Dedicated price color |
| `--c500-status-good-soft` / `--c500-status-bad-soft` | Low-alpha status backgrounds |
| `--c500-font-body` / `--c500-font-mono` | System-font stacks — **do not add a bundled/CDN font**; numerals use the mono stack for tabular alignment |

Both a dark palette (default, unguarded `:root`) and a light palette
(`@media (prefers-color-scheme: light)` + `[data-theme="light"]` override)
are defined — never hardcode a color that only works in one theme.

### Required domain data

Compose these components from real `DeckCard` objects (exported by this
package, along with `Zone`, `Format`, `Bucket`, `BudgetResult`,
`CardCountResult`, `LegalityResult`). **Don't hand-compute derived values**
— call the exported pure functions on a card list instead:

```tsx
import { ZoneSection, BudgetGauge, calculateBudget, type DeckCard } from "cmd500-design-system";

const cards: DeckCard[] = [/* real DeckCard objects */];

<>
  <BudgetGauge budget={calculateBudget(cards)} />
  <DndContext>
    <ZoneSection zone="mainDeck" cards={cards} nameLanguage="pt" />
  </DndContext>
</>;
```

Also exported: `calculateCardCount`, `checkLegality`, `manaCurveBuckets`,
`colorBuckets`, `typeBuckets`, `displayName`, `isBasicLand`.

### Language

The product UI is **Portuguese (pt-BR) only** — always pass
`nameLanguage="pt"` and write copy in pt-BR, never English.

### Where the real source lives

Read `styles.css` (imports the real, shipped `panel.css` token file) and
`guidelines/night-ledger.md` before hand-tuning any color or spacing value
— they're the canonical definitions this summary is drawn from.

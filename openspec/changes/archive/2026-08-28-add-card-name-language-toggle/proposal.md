## Why

Every LigaMagic card row already carries two names — the canonical English name (in the card link's `href`) and LigaMagic's own Portuguese display name (in the link's visible text) — but the extension currently keeps only the English one and throws the Portuguese text away. Some users would rather browse their deck under the names they know from the Portuguese-language site they captured it from. Since both names are already present in every captured row, showing either one is a display choice, not a data-fetching problem.

## What Changes

- Capture both the canonical English name and LigaMagic's Portuguese display name for every card (deck and collection pages), instead of discarding the Portuguese one.
- Add a name-language toggle, in the full-tab view's header alongside the existing theme toggle, that switches displayed card names between English (the default, matching current behavior) and Portuguese. The choice persists across sessions, the same way the theme preference does.
- The toggle is presentational only: it changes what's shown in List rows, Visual tiles, and hover previews. It does not change the canonical identity used for Scryfall lookups, dedup/grouping, budget calculation, or legality checks — those always use the English name.
- The per-zone name filter matches against both the English and Portuguese names at once, regardless of which one is currently displayed.
- Sorting by name uses whichever language is active *at the moment the user selects (or re-selects) the Name sort axis*, and does not re-sort automatically when the toggle is flipped afterward — only the next interaction with the sort-axis control re-syncs it. The name tiebreak used by every other sort axis (mana value, color, price) always uses the English name, independent of the toggle, so switching the display language never reorders a deck that isn't sorted by name.
- Exported decklist text (both the LigaMagic-import format and the readable format) always uses the English name, regardless of the toggle, so exports stay compatible with LigaMagic's own import and Scryfall-based tooling no matter what's on screen.

## Capabilities

### New Capabilities
- `card-name-language`: the header toggle control that switches card-name display between English and Portuguese, defaulting to English, with the choice persisted across sessions.

### Modified Capabilities
- `deck-page-capture`: initial capture also extracts each card's Portuguese display name from the page markup (deck and collection pages), alongside the existing canonical English name.
- `localization`: card names are no longer categorically excluded from translation — they render in English by default (unchanged from today) but the user may switch List rows, Visual tiles, and hover previews to LigaMagic's Portuguese names via the new toggle. UI text and documentation continue to render only in Brazilian Portuguese, unaffected by this toggle.
- `deck-organizer`: the per-zone name filter matches a typed substring against both the English and Portuguese names, regardless of the active display language. The Name sort axis and its use as a tiebreak for other axes are refined to specify their relationship to the new display toggle (Name axis snapshots the active language at selection time; the tiebreak always uses English).
- `deck-export`: both export formats are specified to always use the canonical English name, regardless of the active display toggle.

## Impact

- `extension/src/lib/deck/types.ts`: `CapturedCard` gains a Portuguese display name field (e.g. `pageNamePt`), page-captured like `pageLowestPrice`/`pageImageUrl`; the canonical `name` field's meaning (English) is unchanged.
- `extension/src/lib/capture/deck-page-parser.ts` and `collection-page-parser.ts`: capture the anchor's visible text as the Portuguese name whenever the canonical name was resolved from the `href`, instead of only using it as a same-value fallback.
- New `extension/src/tab/use-name-language-preference.ts` (or similar), mirroring `use-theme-preference.ts`'s persisted-preference pattern, minus the OS-preference detection theme uses (no OS signal applies here).
- `extension/src/tab/TabRoot.tsx`: renders the new toggle control in the header.
- `extension/src/ui/components/CardRow.tsx`, `CardVisualTile.tsx`, and any hover-preview component: render the active language's name.
- `extension/src/lib/organizer/group-sort.ts`: `compareByName` gains a language parameter for the primary Name-axis comparison; the tiebreak use stays hardcoded to English. Sort-axis selection state in the UI layer snapshots the active language when the user (re)selects the Name axis.
- Zone filter logic (wherever the per-zone filter is implemented, per `deck-organizer`'s existing filter requirement): matches against both `name` and `pageNamePt`.
- `extension/src/lib/export/generate-decklist.ts`: unaffected in behavior (already uses the canonical `name`), but worth an explicit test asserting export ignores the display toggle.
- No changes to `extension/src/lib/scryfall/client.ts`, legality, or budget calculation — all continue to key exclusively on the canonical English `name`.

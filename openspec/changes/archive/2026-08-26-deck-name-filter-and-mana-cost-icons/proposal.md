## Why

Main Deck and Maybeboard routinely hold 60-100+ cards each, with no way to jump straight to a specific card by typing its name, and List view rows show only a name/price/quantity with no sense of how expensive a card's mana cost is — a glance LigaMagic's own deck page already gives for free via its official mana-symbol icons.

## What Changes

- Add an independent name filter to each of the Main Deck and Maybeboard zones (own search box per zone, not a single shared control): typing narrows that zone's visible cards by substring match on name, hides any group left with no matches, and updates that zone's header count to reflect the filtered set. Filtering is a display-only concern — it never changes budget, card count, legality totals, or drag-and-drop, and does not apply to the Comandante/Comandante Parceiro hero zones.
- Capture each card's mana cost directly from LigaMagic's own page DOM at capture time (the `.deck-cmc` / `abbr.mtg-symbol` elements already present per card row, resolved via the browser's computed `background-image` to each symbol's canonical code) — no Scryfall dependency, mirroring how artwork is already captured page-side.
- Render each card's mana cost as LigaMagic's own official mana-symbol icons in List view rows, hotlinked directly from LigaMagic's asset URLs (same precedent as existing artwork hotlinking), positioned between the card name and price. Cards with no captured mana cost (lands) show no pips, the same way they show no price oddity today.

## Capabilities

### New Capabilities
(none)

### Modified Capabilities
- `deck-organizer`: adds a per-zone name filter requirement for Main Deck and Maybeboard, and clarifies how the existing grouping requirement behaves when a filter narrows a zone's cards (empty groups hidden, header count reflects the filtered set).
- `deck-page-capture`: extends the "Initial decklist capture from page HTML" requirement so captured cards also carry their mana cost, resolved from the page's own mana-symbol markup.
- `card-visual-view`: List view rows are no longer strictly name-only — they additionally show the card's mana cost as icons, sourced from the newly captured data.

## Impact

- `extension/src/lib/capture/deck-page-parser.ts`: new `extractManaCost` helper alongside `extractLowestPrice`/`extractPageImageUrl`.
- `extension/src/lib/deck/types.ts`: `CapturedCard` (and therefore `DeckCard`) gains a captured mana-cost field.
- `extension/src/ui/components/CardRow.tsx`: renders the mana-cost pips.
- `extension/src/ui/components/ZoneSection.tsx`: owns the per-zone filter input and filters/hides groups before rendering.
- `extension/src/ui/panel.css`: pip sizing/layout, filter input styling.
- `extension/test/fixtures/ligamagic-deck-full.html` and the deck-page-parser tests: extended with mana-cost markup so the new extraction is covered.
- No changes to `extension/src/lib/scryfall/client.ts` or the `card-data-service` capability — mana cost does not depend on Scryfall.

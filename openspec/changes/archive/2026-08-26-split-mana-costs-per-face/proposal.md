## Why

A card with more than one real printed mana cost (double-faced, split, or adventure cards) currently either shows no mana cost at all, or shows LigaMagic's own concatenated run of symbols with no boundary between faces — sometimes correct, sometimes not, depending on the specific card. `fix-mana-cost-hybrid-and-dfc-symbols` deliberately left this as a documented limitation because the page's own markup gives no reliable signal for where one face's cost ends and the next begins. Fetching each face's real cost directly from Scryfall removes that ambiguity, so every multi-cost card can show its true costs, clearly separated.

## What Changes

- Extend Scryfall card enrichment to also resolve each face's own mana cost, for cards with more than one real printed cost.
- Render each face's mana-cost icons in List view, in order, separated by `//` — matching the same separator LigaMagic and Scryfall already use in these cards' own names (e.g. "Thranduil, Sindarin Liege // Silvan Rally"). Applies to any card with more than one real per-face cost (double-faced, split, adventure), replacing both the page's own concatenated-and-sometimes-wrong symbols and the "no cost shown" treatment split cards got.
- Supersedes the split-suppression and the documented adventure/modal-double-faced limitation from `fix-mana-cost-hybrid-and-dfc-symbols`. Intended to land after that change is archived — this proposal's delta is written against the current main specs (which don't yet include that change's not-yet-synced behavior), so archiving order matters to avoid two deltas modifying the same requirement independently.

## Capabilities

### New Capabilities
(none)

### Modified Capabilities
- `card-data-service`: card enrichment also resolves each face's own mana cost for a card with more than one real printed cost.
- `card-visual-view`: List view shows each face's mana-cost icons, separated by `//`, for a card with more than one real per-face cost — rather than the page's own concatenated symbols or no icons at all.

## Impact

- `extension/src/lib/scryfall/client.ts`: extract `card_faces[].mana_cost` when a card has more than one face with a non-empty cost.
- `extension/src/lib/deck/types.ts`: `CardEnrichment` gains a field for per-face mana costs.
- `extension/src/ui/components/ManaCostIcons.tsx` (or `CardRow.tsx`): parse each face's Scryfall-format cost string (`"{2}{G/U}{G/U}"`) into the existing canonical symbol codes, and render a `//` divider between faces.
- `extension/src/ui/components/CardRow.tsx`: replace the current `DOUBLE_FACED_LAYOUTS`-based suppression with a check for per-face cost data.
- No change to `extension/src/lib/capture/mana-cost.ts` — page capture remains the source for single-cost cards; per-face Scryfall data only applies once a card is confirmed to have more than one real cost.

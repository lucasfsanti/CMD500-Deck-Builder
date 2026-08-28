## Why

Mana-cost icons silently disappear for two distinct classes of card: any card whose cost includes two-color hybrid mana (an unmapped symbol slug trips the "unrecognized symbol → drop the whole cost" rule), and split cards, where LigaMagic concatenates both halves' costs into one unmarked sequence with no DOM signal for where one half's cost ends and the other begins — so even a successful decode there would show a misleading, oversized cost rather than either half's real one.

## What Changes

- Extend the mana-symbol decode table with two-color hybrid slugs. `bg` (Black/Green) and `gu` (Green/Blue) are confirmed against a live deck; the remaining eight pairs follow the same alphabetically-ordered two-letter convention.
- Suppress List view's mana-cost icons for split cards (`layout: "split"`), the only layout confirmed — across multiple real cards — to consistently have LigaMagic concatenate both halves' costs. This follows the same "absence over wrong data" rule the feature already applies to lands and unrecognized symbols, rather than showing a technically-decoded but misleading cost.
- Adventure and modal double-faced cards were investigated too, but **not** suppressed: verified live that the *same* Scryfall layout value produces inconsistent LigaMagic markup across different real cards of that layout (concatenated for some, front-face-only for others, with no detectable signal distinguishing which), so no rule based on layout could be correct for all of them. Left as a known, documented limitation rather than a rule that's wrong roughly as often as it's right. Meld and transform cards were also checked and confirmed to never have this problem at all (each has only one printed, castable cost), so neither needs any special handling.

## Capabilities

### New Capabilities
(none)

### Modified Capabilities
- `deck-page-capture`: mana cost capture also decodes two-color hybrid mana symbols, which the current decode table drops as unrecognized.
- `card-visual-view`: List view SHALL NOT show mana-cost icons for split cards, even when the page captured a (concatenated, unreliable) cost for them. Adventure, modal double-faced, transform, and meld cards are all unaffected and continue showing their page-captured cost as-is.

## Impact

- `extension/src/lib/capture/mana-cost.ts`: extend `SLUG_TO_SYMBOL` with the ten two-color hybrid pairs, each mapped to a slash-free canonical code (`BG`, not `B/G`) matching the real asset filename (`.../symb/BG.svg`) — mirroring the Phyrexian entries already in the table (`BP`, not `B/P`).
- `extension/src/ui/components/CardRow.tsx`: gate `ManaCostIcons` rendering on `card.enrichment?.layout` being `"split"`.
- `extension/src/lib/capture/mana-cost.test.ts`: add hybrid-symbol decode coverage.
- `extension/src/ui/components/CardRow.test.tsx`: add coverage for split suppression and for transform/modal_dfc/adventure/meld staying unaffected.
- No change to how mana cost is extracted from the DOM, and no new Scryfall dependency — `CardEnrichment.layout` is already part of the existing enrichment pipeline.

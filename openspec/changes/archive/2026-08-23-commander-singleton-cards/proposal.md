## Why

Commander is a singleton format (basic lands excepted), but the deckbuilder shows an editable quantity field on every card and has no explicit way to remove a card from the deck — quantity-to-zero is the only pseudo-removal path today, and it doesn't even hide the card. Scoping quantity to what Commander actually allows, and replacing that broken pseudo-removal with a real one, aligns the tool with how these decks are actually built.

## What Changes

- Remove the quantity input from non-basic cards in both List and Visual view; basic lands keep it unchanged.
- Normalize a non-basic card's quantity to 1 wherever it enters deck state (initial capture and any later re-sync from LigaMagic), regardless of what the source page showed.
- Add a hover-revealed delete affordance to every card (row and tile) that removes it from the deck outright — the deckbuilder's first explicit removal action, and the replacement for the quantity-zero path non-basic cards are losing.

## Capabilities

### New Capabilities
(none)

### Modified Capabilities
- `deck-organizer`: manual quantity editing is scoped to basic lands only; non-basic quantity is normalized to 1 on capture; a new requirement adds explicit per-card removal.
- `card-visual-view`: Visual view's per-card display/editing (quantity, and the new delete affordance) is updated to match the deck-organizer change.

## Impact

- `extension/src/ui/components/CardRow.tsx`, `CardVisualTile.tsx` — conditional quantity input, new delete control
- `extension/src/ui/components/ZoneSection.tsx` — wires a new remove callback alongside the existing quantity callback
- `extension/src/tab/use-tab-deck.ts` — `toDeckCard` normalization, new `removeCard` action
- `extension/src/lib/organizer/deck-state.ts` — new `removeCard` state operation
- `extension/src/tab/TabRoot.tsx` — wires `removeCard` through to `ZoneSection`
- `extension/src/ui/panel.css` — delete control styling (hover-revealed)
- Corresponding test files for each of the above

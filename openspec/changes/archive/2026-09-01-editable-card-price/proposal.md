## Why

LigaMagic's captured price can be missing, stale, or wrong for a specific printing, and the user currently has no way to correct it — the price is rendered as plain read-only text everywhere it appears. The user should be able to fix a card's price by hand, including the primary Comandante's, without that edit silently breaking the R$500 budget math.

## What Changes

- The price shown on any card (List row or Visual tile, any zone, any format) becomes editable inline: clicking the price turns it into a number input; committing (Enter or blur) saves the new value, Escape cancels.
- The edit applies to `DeckCard.pageLowestPrice` directly, reusing the same "local edits" persistence path already used by quantity changes and zone moves (`useTabDeck`'s local-edit latch) — no separate override field, no special re-sync merge logic.
- Budget totals recompute live from the edited price using the existing zone-based inclusion rule: editing a Main Deck or Comandante Parceiro card's price changes the R$500 total; editing the primary Comandante's price does not, since that zone is already excluded from budget by design.
- Moving cards into/out of the Comandante zone (including swapping the commander itself) is **not** part of this change — that already works today via existing drag-and-drop and is out of scope here.

## Capabilities

### New Capabilities
(none)

### Modified Capabilities
- `deck-organizer`: adds a requirement that every card's price is editable inline, parallel to the existing basic-land-only quantity-edit requirement, but scoped to all cards in all zones instead of just basic lands.
- `budget-tracking`: broadens the "Live recomputation on deck changes" requirement's trigger list to include manual price edits on a budget-counted card, alongside add/remove/move/quantity changes.

## Impact

- `extension/src/lib/organizer/deck-state.ts`: new `setCardPrice` mutator alongside `setCardQuantity`.
- `extension/src/tab/use-tab-deck.ts`: new `setPrice` handler wired the same way as `setQuantity` (marks `hasLocalEdits`, updates state).
- `extension/src/tab/TabRoot.tsx`: passes the new handler down to every `ZoneSection`, including the Comandante hero zone.
- `extension/src/ui/components/CardRow.tsx` and `CardVisualTile.tsx`: price span becomes a click-to-edit control; needs the same drag-stopPropagation treatment the existing quantity input uses.
- No change to `extension/src/lib/budget/calculate-budget.ts` — it already recomputes purely from `cards` on every render, so no code change is needed there for totals to reflect edited prices; only the spec's stated trigger list is being brought up to date.

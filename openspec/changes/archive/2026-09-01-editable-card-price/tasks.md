## 1. State layer

- [x] 1.1 Add `setCardPrice(cards, cardId, price: number | undefined): DeckCard[]` to `extension/src/lib/organizer/deck-state.ts`, mirroring `setCardQuantity` (rejects negative/NaN by leaving the card unchanged), and verify with a unit test covering: normal update, rejecting a negative value, rejecting NaN, and setting a price on a card whose price was previously `undefined`.
- [x] 1.2 Add `setPrice(cardId, price)` to `extension/src/tab/use-tab-deck.ts`, following the same shape as `setQuantity` (sets `hasLocalEdits.current = true`, delegates to `setCardPrice`), and verify with a test that a price edit persists across a subsequent relayed re-capture (same pattern already covering `setQuantity`/`moveCard`).

## 2. Shared price-edit control

- [x] 2.1 Extract a small shared price-cell component (e.g. `PriceCell`) used by both `CardRow` and `CardVisualTile`: renders the formatted price as today, switches to a numeric input on click, commits on Enter/blur, cancels on Escape, and rejects non-numeric/negative input by keeping the previous value. Verify with a component test covering commit, cancel, and invalid-input rejection.
- [x] 2.2 Guard the input's `onClick`/`onPointerDown` with `stopPropagation()`, matching the existing basic-land quantity input pattern, and verify with a test that clicking into the price editor does not start a drag.

## 3. Wire into List and Visual views

- [x] 3.1 Replace the read-only price `<span>` in `CardRow.tsx` with `PriceCell`, passing through an `onPriceChange` prop, and verify existing `CardRow.test.tsx` cases still pass plus a new case for editing.
- [x] 3.2 Replace the read-only price `<div>` in `CardVisualTile.tsx` with `PriceCell` the same way, and verify existing `CardVisualTile.test.tsx` cases still pass plus a new case for editing.
- [x] 3.3 Thread `onPriceChange` through `ZoneSection.tsx` (new `onPriceChange` prop passed to both `CardRow` and `CardVisualTile`) and from `TabRoot.tsx` down to every `ZoneSection`, including the Comandante hero zone (which today omits `onRemoveCard` but should still receive `onPriceChange`). Verify by rendering `TabRoot` and confirming a price edit on a Comandante-zone card updates `DeckCard.pageLowestPrice` in state.

## 4. Budget interaction

- [x] 4.1 Verify (no code change expected) that `calculateBudget` already recomputes correctly from an edited price: add a test in `calculate-budget.test.ts` confirming an edited Main Deck/Comandante Parceiro card's new price changes the total, and an edited Comandante price does not.

## 5. Spec alignment

- [x] 5.1 Run `openspec validate --change "editable-card-price" --strict` and resolve any reported issues.

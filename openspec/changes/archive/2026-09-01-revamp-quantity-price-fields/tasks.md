## 1. Shared QuantityStepper component

- [x] 1.1 Create `extension/src/ui/components/QuantityStepper.tsx`: a typeable quantity input flanked by `−`/`+` buttons, taking `card`, `name`, `onQuantityChange`, and `onRemove`. Incrementing/decrementing computes the next value locally; committing a typed value or a decrement that would reach 0 calls `onRemove(card.id)` instead of `onQuantityChange`. Verify with a component test covering: `+` increments, `−` above 1 decrements, `−` at 1 calls `onRemove` (not `onQuantityChange`), and typing `0` and committing calls `onRemove`.
- [x] 1.2 Guard both buttons' and the input's `onClick`/`onPointerDown` with `stopPropagation()`, matching the existing pattern from the old quantity input, and verify with a test that clicking any of the three controls does not start a drag.

## 2. CSS pass: spin buttons, cursor, width

- [x] 2.1 Add a global rule in `panel.css` hiding native spin-button arrows on every `input[type="number"]` (`::-webkit-outer/inner-spin-button` plus the Firefox `-moz-appearance: textfield` fallback), and verify by inspecting the rendered quantity stepper's and price editor's inputs show no native arrows.
- [x] 2.2 Add explicit `cursor` rules: `pointer` on `PriceCell`'s read-only display and on the stepper's `−`/`+` buttons, `text` on both typeable inputs (stepper, price editor) — each scoped to its own class so `.c500-card`/`.c500-tile`'s `cursor: grab` no longer bleeds through. Verify by checking computed style in a test or manual inspection for each control.
- [x] 2.3 Widen the quantity field's CSS width to comfortably fit at least 4 digits (e.g. `4ch` plus existing padding), replacing the current `2.6em`/`2.8em` values, and verify visually that a 3-digit quantity (e.g. 100) renders without clipping.

## 3. Wire into List and Visual views

- [x] 3.1 In `CardRow.tsx`, replace the basic-land-only `<input className="c500-card__qty">` and remove `PriceCell` for basic lands, rendering `QuantityStepper` in the price's former position instead; non-basic cards keep `PriceCell` unchanged. Verify existing `CardRow.test.tsx` cases are updated/still pass, plus new cases: a basic land shows the stepper and no price, a non-basic card shows price and no stepper.
- [x] 3.2 Make the same change in `CardVisualTile.tsx`: remove the overlaid `c500-tile__qty` input, render `QuantityStepper` where the price div was for basic lands, keep `PriceCell` for everything else. Verify existing `CardVisualTile.test.tsx` cases are updated/still pass, plus the same two new cases.
- [x] 3.3 Confirm `ZoneSection.tsx`/`TabRoot.tsx` need no prop-shape changes (`onQuantityChange` and `onRemoveCard` already flow to every zone) — verify by rendering `TabRoot` with a basic land in Main Deck and confirming its `−` button at quantity 1 calls the existing `removeCard` path.

## 4. Spec alignment

- [x] 4.1 Run `openspec validate --change "revamp-quantity-price-fields" --strict` and resolve any reported issues.

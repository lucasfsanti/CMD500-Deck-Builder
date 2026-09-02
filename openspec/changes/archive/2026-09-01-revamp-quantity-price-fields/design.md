## Context

See proposal.md for motivation. Current relevant state:

- `CardRow.tsx` renders, for a basic land, a bare `<input type="number" className="c500-card__qty">` to the left of the name, calling `onQuantityChange` on every keystroke. `CardVisualTile.tsx` renders the equivalent `c500-tile__qty` input absolutely positioned over the artwork. Neither has a decrement-to-remove behavior — `setCardQuantity` (`extension/src/lib/organizer/deck-state.ts`) just clamps negative input to 0 and leaves the row in place.
- `PriceCell.tsx` (from `editable-card-price`) is rendered unconditionally for every card, including basic lands, in both `CardRow` and `CardVisualTile`.
- `.c500-card` and `.c500-tile` (`panel.css`) set `cursor: grab` at the row/tile level; nothing overrides it on `PriceCell`'s read-only display, so it inherits the drag cursor (`cursor` is an inherited property). The quantity `<input>` happens to look fine only because of browser UA-default cursor behavior on inputs, not an explicit rule.
- `.c500-card__qty` (width 2.6em) and `.c500-tile__qty` (width 2.8em) are `type="number"`, so each browser reserves space inside that width for its own spin-button arrows, leaving less room for digits than the CSS width implies.
- `removeCard` (`deck-state.ts`) already fully removes a card by id; `useTabDeck`'s `removeCard` wraps it with the same `hasLocalEdits` latch every other mutator uses.

## Goals / Non-Goals

**Goals:**
- Replace the basic-land quantity input and the basic-land price display with one `QuantityStepper` control, shared between List and Visual view the same way `PriceCell` already is.
- Route "reach zero" (via the `−` button or by typing `0`) through the existing full-removal path, not a new one.
- Fix cursor affordance and native spin-button removal as a small, general CSS/markup pass across every number input in the deck view (quantity stepper and price editor alike).
- Widen the quantity field enough for 3 digits.

**Non-Goals:**
- No change to non-basic cards' price editing (`editable-card-price` behavior stands as-is for them).
- No change to how the dedicated `×` removal control works, or to drag-and-drop.
- No change to quantity semantics beyond "reaching 0 removes the card" — no upper bound, no new validation beyond what `setCardQuantity`/`removeCard` already do.

## Decisions

**One shared `QuantityStepper` component, mirroring `PriceCell`'s shape.** Props: `card`, `name` (for aria-labels), `onQuantityChange`, `onRemove` (called instead of `onQuantityChange` when the result would be 0), plus a `className`/`as` pair so `CardRow` and `CardVisualTile` can each place it with their own layout, exactly like `PriceCell` already does. Alternative considered: keep quantity logic inline in each component as today — rejected, since the "reach 0 removes" branch and the +/− click handlers would otherwise be duplicated verbatim in both files (the same duplication `PriceCell`'s extraction already avoided for price).

**"Reach 0" routing lives in `QuantityStepper` itself, not in `deck-state.ts`.** The component computes the next quantity locally (current ± 1, or the typed value) and calls `onRemove(card.id)` instead of `onQuantityChange(card.id, 0)` whenever that next value is ≤ 0. `setCardQuantity` and `removeCard` themselves stay exactly as they are — no new state-layer function needed, since "call remove instead of setting to 0" is a decision about *which* existing callback to invoke, not new deck-state logic. Alternative considered: teach `setCardQuantity` to special-case 0 and return a sentinel meaning "remove me" — rejected, it would make a pure `DeckCard[] → DeckCard[]` function respond in a shape its signature doesn't reflect, and every caller would need to check for the sentinel anyway.

**Spin buttons removed via a single global CSS rule**, not per-input classes:
```css
input[type="number"]::-webkit-outer-spin-button,
input[type="number"]::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
input[type="number"] {
  -moz-appearance: textfield;
  appearance: textfield;
}
```
This covers the quantity stepper's input and the existing price editor's input identically, and any future number input for free — cheaper than repeating it per component class, and there's no case in this app where a native spinner is wanted.

**Cursor rules are explicit per interactive element, not a blanket override on `.c500-card`/`.c500-tile`.** Setting `cursor: pointer` on the read-only price display, the stepper's `−`/`+` buttons, and `cursor: text` on both typeable inputs (stepper, price editor) — each scoped to its own class — rather than trying to un-inherit `grab` globally, since the row/tile itself should still show `grab` everywhere that isn't one of these specific controls.

**Quantity field width becomes `4ch` (character-unit, not `em`)**, matching how `.c500-price-input` was already sized in `ch`-adjacent terms (it used `em` at 4.6 for up to ~6 chars including "R$" — the quantity field has no currency prefix, so 4 digits' worth of `ch` is comfortably more than the "up to 3 digits, occasionally 4" the app needs to support).

## Risks / Trade-offs

- **Basic lands losing their price display entirely** → they never counted toward budget anyway (`isBudgetCounted` already excludes them); if a user wants to check a specific basic land's price they can still see it on the LigaMagic source page. Accepted per proposal.
- **Typing "0" now deletes the row instead of leaving it at 0** → slightly more destructive than today's clamp-to-0 behavior, but consistent with the `−`-button behavior decided in explore mode, and matches how the format is actually played (a 0-count "phantom" land isn't meaningful to keep around).
- **`QuantityStepper`'s extra buttons add two more focusable/clickable targets inside an already-draggable row** → mitigate with the same `stopPropagation` guard `PriceCell`'s input and the old quantity input already use, applied to both new buttons.

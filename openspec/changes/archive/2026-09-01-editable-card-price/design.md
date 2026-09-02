## Context

Price today lives on `DeckCard.pageLowestPrice` (`extension/src/lib/deck/types.ts`), populated once at capture from `deck-page-parser.ts` and rendered read-only by a shared `formatPrice()` helper duplicated in `CardRow.tsx` and `CardVisualTile.tsx`. `useTabDeck` (`extension/src/tab/use-tab-deck.ts`) already has a one-way "local edits" latch: the first call to `moveCard`, `setQuantity`, or `removeCard` sets `hasLocalEdits.current = true`, which permanently stops the relayed-capture effect from overwriting `cards` on re-sync. `calculateBudget` (`extension/src/lib/budget/calculate-budget.ts`) is a pure function recomputed from `cards` on every render, filtered by `isBudgetCounted` (Main Deck + Comandante Parceiro only, basics excluded). See proposal.md for the motivating problem and the confirmed decisions (Comandante stays budget-exempt even once editable; click-to-edit inline is the chosen interaction).

## Goals / Non-Goals

**Goals:**
- Let the user correct any card's price inline, in any zone, in both List and Visual view.
- Reuse the existing local-edit persistence path rather than introducing a second source of truth for price.
- Keep `calculate-budget.ts` untouched — the zone-based inclusion rule already produces the agreed behavior once `pageLowestPrice` is writable.

**Non-Goals:**
- Commander move UX (drag a card into/out of Comandante) — already implemented, out of scope for this change.
- Preserving the originally-captured LigaMagic price for later comparison or "reset to captured" — not requested; the edit overwrites `pageLowestPrice` in place, same as how quantity edits overwrite `quantity` in place today.
- Fetching or validating prices against Scryfall/LigaMagic — this is a pure local override, not a re-lookup.

## Decisions

**Overwrite `pageLowestPrice` directly, no separate override field.** Alternative considered: add a `manualPriceOverride: number | undefined` field so the original captured price stays inspectable. Rejected — nothing else in the deck model preserves pre-edit values (quantity edits overwrite `quantity` outright), the local-edits latch already means a re-sync will never bring the captured value back anyway, and a dual-field model would need its own precedence rule in `calculateBudget` and every render path for no requested benefit.

**One shared `setCardPrice(cards, cardId, price)` in `deck-state.ts`, mirroring `setCardQuantity`.** Keeps the same shape as the existing organizer mutators (pure function over `DeckCard[]`, wired into `useTabDeck` the same way `setQuantity` wires in). `useTabDeck` gets a `setPrice(cardId, price)` that sets `hasLocalEdits.current = true` and delegates, identical in structure to the existing `setQuantity`.

**Inline click-to-edit, implemented once and shared between `CardRow` and `CardVisualTile`.** Both components already duplicate a `formatPrice()` helper; the edit control (an input that replaces the price `<span>`/`<div>` on click, commits on Enter/blur, cancels on Escape, validates non-negative numeric input before committing) should be factored into one small shared piece rather than duplicated a second time, to avoid the two views drifting. Needs the same `onClick`/`onPointerDown` `stopPropagation()` guard the existing basic-land quantity `<input>` already uses, so opening the editor doesn't start a drag.

**No validation beyond "non-negative number."** LigaMagic prices are plain BRL decimals; there's no format-specific constraint (no currency limits, no printing-specific bounds) worth enforcing beyond rejecting garbage input and negative values.

## Risks / Trade-offs

- **Destructive overwrite** → once edited, the original captured price for that session is gone (matches existing quantity-edit precedent; acceptable per Non-Goals).
- **Shared edit-control extraction touches two existing components' render paths** → mitigate by keeping the extraction narrow (just the price cell's markup/state), not restructuring `CardRow`/`CardVisualTile` further.
- **Every card becoming price-editable (not just basics, unlike quantity) increases the clickable surface inside a draggable row/tile** → mitigate with the same stopPropagation pattern already proven for the quantity input; verify manually that dragging still works after the edit control is added.

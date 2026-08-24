## Context

`CardRow`/`CardVisualTile` currently render an unconditional quantity `<input>`, wired to `onQuantityChange` → `useTabDeck.setQuantity` → `deck-state.setCardQuantity`. Every captured card (initial capture and any relayed re-sync from the source LigaMagic tab) funnels through a single point, `toDeckCard()` in `use-tab-deck.ts`, before entering `cards` state — re-sync stops entirely once `hasLocalEdits.current` is set by any edit. `isBasicLand(name)` already exists (`lib/deck/types.ts`) and is used today by budget calc. There is currently no removal action anywhere in the app; quantity-to-zero was the closest thing, and it doesn't hide the card. See proposal.md for why this needs to change.

## Goals / Non-Goals

**Goals:**
- Quantity input present only for basic lands.
- Non-basic quantity is authoritatively 1 everywhere dependent totals (budget, card count, legality) read it — not just visually hidden.
- A real, discoverable removal action exists for every card, replacing the pseudo-removal non-basics are losing.

**Non-Goals:**
- No card-details modal (explicitly deferred by the user).
- No new drop zone / trash-zone drag target for removal — this is a click-style control, not a drag gesture.
- No change to how quantity is captured from the LigaMagic page itself (the parser keeps reading the page's raw value verbatim); normalization happens after capture, in state assembly.

## Decisions

**Normalize in `toDeckCard()`, not in the parser or in `setCardQuantity`.** `toDeckCard()` is the one place both first capture and every re-sync pass through, and it already has the card's name. Normalizing there means `deck-page-capture` keeps reporting exactly what the page shows (still useful for debugging/tests), while every consumer of `cards` state sees the singleton-normalized value. `setCardQuantity` is left as-is (clamped to `Math.max(0, ...)`) since it's only reachable from the basic-land quantity input now — non-basic cards have no UI path to call it.

**Removal control is a small, always-in-the-DOM, hover-revealed element — not a JS hover-state toggle.** `CardRow` already tracks pointer position in JS for the hover art-preview, but that's driving positioning math, not visibility. Visibility here is pure CSS (`opacity`/`display` on `:hover`), matching the zero-JS cost of "reveal on hover" and avoiding a second pointer-tracking state that would have to stay in sync with drag state. The control gets its own `onClick`/`onPointerDown` with `stopPropagation()`, the same technique the quantity input already uses to coexist with the row/tile's `useDraggable` listeners — no new activation-constraint tuning needed on `DndContext`.

**Removal control shown for all cards, including basics.** Basics already have quantity→0 as a removal path; adding the same hover control to them too avoids a "why does this card have a delete button and that one doesn't" inconsistency, at negligible cost (one more render of the same control).

**New `removeCard` operation lives in `deck-state.ts` alongside `moveCard`/`setCardQuantity`**, as a pure `(cards, cardId) => cards` filter — no zone-specific logic needed, since removal is zone-agnostic (works the same whether the card is in Comandante, Main Deck, etc.).

## Risks / Trade-offs

- **Accidental removal** (misclick on a tightly-packed list) → mitigated by the hover-reveal (control isn't reachable without deliberately targeting the card first) and by removal being a single explicit click on a small control, not a side effect of any other action. No confirmation dialog is introduced — consistent with the app's existing no-confirmation drag-and-drop moves.
- **Emptying the Comandante zone via removal** is not special-cased — it behaves the same as the zone simply never having had a card, which the organizer already handles.

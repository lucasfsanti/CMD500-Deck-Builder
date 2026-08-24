## 1. Normalize non-basic quantity in state

- [x] 1.1 In `extension/src/tab/use-tab-deck.ts`, update `toDeckCard()` to force `quantity: 1` for any card where `!isBasicLand(captured.name)`, importing `isBasicLand` from `../lib/deck/types`; leave basic-land quantity untouched. Verify with a new case in `use-tab-deck.test.ts` asserting a captured non-basic card with `quantity: 3` seeds into `cards` state as `quantity: 1`, and a basic land with `quantity: 20` seeds unchanged.
- [x] 1.2 Add a case to the same test covering re-sync: a second relayed capture (before any local edit) reporting a non-basic card's quantity as 2 still normalizes to 1 once applied to `cards` state.

## 2. Add `removeCard` state operation

- [x] 2.1 Add `removeCard(cards: DeckCard[], cardId: string): DeckCard[]` to `extension/src/lib/organizer/deck-state.ts`, filtering out the matching card (no-op if the id isn't found). Add a `describe("removeCard")` block to `deck-state.test.ts` covering: removes the matching card, leaves other cards untouched, and is a no-op for an unknown id. Verify `npm test -- deck-state` passes.
- [x] 2.2 Add a `removeCard(cardId: string)` action to `extension/src/tab/use-tab-deck.ts` mirroring `setQuantity` (sets `hasLocalEdits.current = true`, calls `removeCard` from `deck-state.ts`, updates `cards` state) and return it from the hook. Add a case to `use-tab-deck.test.ts` verifying a removed card no longer appears in `cards`. Verify `npm test -- use-tab-deck` passes.

## 3. Scope the quantity input to basic lands

- [x] 3.1 In `extension/src/ui/components/CardRow.tsx`'s `CardRowContent`, render the quantity `<input>` only when `isBasicLand(card.name)`; render nothing in its place for non-basic cards (no layout placeholder needed — verify visually in task 5.2). Verify existing `CardRow.test.tsx` cases still pass and add a case asserting the quantity input is absent for a non-basic card and present for a basic land.
- [x] 3.2 Apply the same change to `CardVisualTileContent` in `extension/src/ui/components/CardVisualTile.tsx`. Add the equivalent present/absent case to `CardVisualTile.test.tsx`. Verify `npm test -- CardRow CardVisualTile` passes.

## 4. Hover-revealed removal control

- [x] 4.1 Add a small delete control (button, e.g. `c500-card__remove` / `c500-tile__remove`) to `CardRowContent` and `CardVisualTileContent`, taking an `onRemove?: (cardId: string) => void` prop; give it `onClick`/`onPointerDown` handlers that call `e.stopPropagation()` before invoking `onRemove`, matching the existing quantity-input pattern so it doesn't trigger the row/tile's drag listeners. Thread `onRemove` through `CardRowProps`/`CardVisualTileProps` the same way `onQuantityChange` is threaded.
- [x] 4.2 In `extension/src/ui/panel.css`, style the control hidden by default and revealed via `:hover` on the row/tile (`opacity: 0` → `opacity: 1`, no JS state), for both `.c500-card` and `.c500-tile`.
- [x] 4.3 Wire an `onRemoveCard` prop through `extension/src/ui/components/ZoneSection.tsx` (alongside the existing `onQuantityChange`) down to both `CardRow` and `CardVisualTile`.
- [x] 4.4 Wire `removeCard` from `useTabDeck` through `extension/src/tab/TabRoot.tsx`'s two `<ZoneSection>` usages as `onRemoveCard`.
- [x] 4.5 Add test coverage in `CardRow.test.tsx` and `CardVisualTile.test.tsx`: clicking the remove control calls `onRemove` with the card's id, and does not also fire a drag-start. Verify `npm test -- CardRow CardVisualTile` passes.

## 5. Final verification

- [x] 5.1 Run `npm run typecheck` and `npm test` from `extension/` and confirm both pass cleanly. (Also ran `npm run build` clean.)
- [x] 5.2 Manually exercise the full-tab view in a browser against a real or fixture-backed LigaMagic deck page: confirm non-basic cards show no quantity field in both List and Visual view, basic lands keep their editable quantity field, hovering any card reveals its remove control without it appearing unhovered, clicking remove takes the card out of its zone immediately with the budget/card-count/legality panels updating, and dragging cards between zones still works unaffected (the remove control doesn't interfere with drag-start). Verified live against the real LigaMagic site (deck id 10174508, via a temporary Playwright script mirroring the project's own `scripts/verify-*.mjs` convention — opened the extension's tab view via the same `sourceTabId`/`deckId` relay `handleActionClicked` uses, since this deck now opens in a dedicated tab rather than an in-page overlay; deleted after use): the non-basic commander "Xyris, the Writhing Storm" showed no quantity input in either List or Visual view, its remove control was invisible until hover then clickable, clicking it removed the card from the deck entirely (Main Deck's count correctly stayed at 99 since the commander isn't counted there); Visual view's basic land "Island" kept its editable quantity input; a List-mode drag (Scrawling Crawler → Maybeboard) still completed successfully, confirming the remove control doesn't interfere with drag-start. Screenshots confirmed visually, then deleted along with the script.

  **Follow-up (post-verify-report)**: `/opsx:verify` flagged that the removal control only revealed on `:hover`, leaving keyboard/screen-reader users an invisible focus target (still focusable and activatable, just `opacity: 0`). Fixed in `extension/src/ui/panel.css` by also revealing on `:focus-visible` (`.c500-card__remove:focus-visible` / `.c500-tile__remove:focus-visible`, alongside the existing `:hover` reveal). `npm run typecheck` and `npm test` (238/238) re-verified clean; not covered by an automated test since these component tests render without `panel.css` applied (verified the same way the rest of this control's CSS was — visually, not via unit test).

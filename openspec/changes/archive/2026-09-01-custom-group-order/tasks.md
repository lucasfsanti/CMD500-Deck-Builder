## 1. Data model and sort logic

- [x] 1.1 Add `customOrder?: { axis: GroupingAxis; groupKey: string; rank: number }` to `DeckCard` in `extension/src/lib/deck/types.ts`.
- [x] 1.2 In `group-sort.ts`, change `sortWithinGroup` (or its callers) so that within a bucket, cards whose `customOrder.axis`/`customOrder.groupKey` match the active grouping axis and this group's key are ordered by `customOrder.rank`, and every other card in the bucket sorts by the existing sort-axis comparator, appended after the ranked ones. A bucket with no matching-ranked card behaves exactly as it does today. Verify with unit tests: a fully custom-ordered group ignores the sort axis; a group with no custom order is unaffected; a new unranked card in an otherwise custom-ordered group appears after every ranked card; a `customOrder` stamped under a different grouping axis or a different group key is ignored (falls back to sort-axis order for that card).

## 2. Deck-state mutators

- [x] 2.1 Add `reorderWithinGroup(cards: DeckCard[], groupingAxis: GroupingAxis, groupKey: string, orderedCardIds: string[]): DeckCard[]` to `extension/src/lib/organizer/deck-state.ts`: stamps `customOrder = { axis: groupingAxis, groupKey, rank: index }` onto each card whose id appears in `orderedCardIds`, at that id's index; leaves every other card untouched. Verify with unit tests covering: a full group re-ranked in a new sequence; cards outside the given group/ids are unaffected; re-running it with a different sequence overwrites the previous ranks.
- [x] 2.2 Add `clearCustomOrder(cards: DeckCard[]): DeckCard[]` that strips `customOrder` from every card, deck-wide. Verify with a unit test that it clears ranks set under multiple different axes/groups in one call.
- [x] 2.3 Wire both into `extension/src/tab/use-tab-deck.ts` as `reorderWithinGroup(groupingAxis, groupKey, orderedCardIds)` and `clearCustomOrder()`, following the existing `hasLocalEdits`-marking pattern used by `setQuantity`/`setPrice`/`moveCard`. Verify with hook tests mirroring the existing `use-tab-deck.test.ts` patterns for those.

## 3. Drag-and-drop: adopt @dnd-kit/sortable for within-group reordering

- [x] 3.1 Add `@dnd-kit/sortable` as a dependency.
- [x] 3.2 In `ZoneSection.tsx`, wrap each rendered `CardGroup`'s cards in their own `SortableContext` (that group's card ids, in current display order), nested inside the zone's existing `useDroppable`. Verify with a test that each group renders its own `SortableContext` boundary (e.g. by checking sortable ids passed match the group's cards) and that groups don't share one context.
- [x] 3.3 Give `CardRow` and `CardVisualTile` a `useSortable` variant (in addition to their existing `useDraggable`-only registration) so they're valid drop targets for a same-group reorder, without breaking their existing role as the `DragOverlay` source or their cross-zone draggability. Verify existing drag-related tests in both components still pass.
- [x] 3.4 In `TabRoot.tsx`'s `handleDragEnd`, branch on the drop target: `over.id` resolving to a zone id keeps today's `moveCard` call unchanged; `over.id` resolving to another card's id in the *same* zone and the *same* group key computes the new id sequence (via `@dnd-kit/sortable`'s `arrayMove`) and calls `reorderWithinGroup`; `over.id` resolving to a card in the same zone but a *different* group key is a no-op. Verify with tests for all three branches, plus confirming a genuine cross-zone drop (different zones) is unaffected and still uses `moveCard`.

## 4. Reset affordance

- [x] 4.1 Generalize the existing Name-axis `↻` resync button in `TabRoot.tsx` to also appear whenever any card has a `customOrder` set (not only the Name/language-mismatch condition), and to call `clearCustomOrder()` in that case. Verify with a test that the resync control appears after a reorder and, when clicked, every group renders by the active sort axis again.
- [x] 4.2 Wire the sort-axis `<select>`'s existing `onChange` handler to also call `clearCustomOrder()` whenever the newly selected value differs from the previous one. Verify with a test that picking a different sort axis clears an existing custom order.

## 5. Spec alignment

- [x] 5.1 Run `openspec validate --change "custom-group-order" --strict` and resolve any reported issues.

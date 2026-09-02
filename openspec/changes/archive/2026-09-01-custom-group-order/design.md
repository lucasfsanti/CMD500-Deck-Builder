## Context

See proposal.md for motivation and the three confirmed decisions (dormant-not-discarded across grouping-axis switches, resync-clears-everything on sort-axis (re)selection, new arrivals appended at the end).

Current state this builds on:
- `groupAndSortZone` (`extension/src/lib/organizer/group-sort.ts:244`) is a pure function: given `cards`, `groupingAxis`, `sortAxis`, `sortNameLanguage`, it buckets into `CardGroup[]` and sorts each bucket with `sortWithinGroup`. Nothing about a card's position is stored anywhere — it's fully recomputed every render.
- Drag-and-drop is zone-level only: `TabRoot.tsx`'s single `DndContext` (`pointerWithin` collision detection) plus one `useDroppable({ id: zone })` per `ZoneSection`. `handleDragEnd` resolves the drop to a zone id via `resolveDropZone` and calls `moveCard`, which explicitly no-ops when `card.zone === toZone` (`deck-state.ts:23`). There is no per-card drop target today, and `@dnd-kit/sortable` is not a dependency (only `@dnd-kit/core` is).
- `DeckCard` (`extension/src/lib/deck/types.ts`) already carries several optional per-card fields (`enrichment`, `pageImageUrl`, etc.) — the established pattern for "this card may or may not have this extra data" is a field on the card itself, not a side table.

## Goals / Non-Goals

**Goals:**
- A group's custom order survives a grouping-axis round trip (switch away, switch back) without recomputation or data loss.
- A group's custom order is scoped tightly enough that it can never leak into a differently-partitioned group under another axis, or into a same-named-but-different group later.
- Reuse the existing `moveCard`/zone-level drag path unchanged for actual cross-zone moves; add reordering as a genuinely separate interaction, not a variant of it.

**Non-Goals:**
- No fine-grained "drop a cross-zone card at this exact position" — a card dragged in from another zone is always appended at the end of its target group's custom order (per proposal.md). Only a same-zone, same-group drag gets position-aware placement.
- No persistence beyond the session — custom order lives on `DeckCard` the same way zone/quantity/price edits already do, and is lost on tab reload exactly like those are today (the app has no cross-reload persistence for any of them beyond `format`).
- No cross-group drag: a card's group membership (type/color/cmc) is intrinsic and a drag gesture cannot change it, so a drop that lands on a different group than the dragged card's own is a no-op, not a reclassification.

## Decisions

**Custom order lives in one optional nested field per card, keyed by the axis and group it was set under:**
```ts
interface DeckCard {
  // ...
  customOrder?: { axis: GroupingAxis; groupKey: string; rank: number };
}
```
`groupKey` matches `CardGroup.type` (e.g. `"Creature"`, `"3"`, `"Blue"`). `sortWithinGroup` only honors a card's `customOrder` when `customOrder.axis === activeGroupingAxis && customOrder.groupKey === thisGroup.type` — which is exactly what makes dormancy-not-discarding fall out for free: switching the grouping axis makes every card's stored `customOrder` mismatch the new buckets (so they fall back to sort-axis ordering, untouched), and switching back makes it match again, instantly, with no recomputation.

Alternative considered: a separate ordering table (`Record<axis, Record<groupKey, cardId[]>>`) decoupled from `DeckCard`. Rejected — every other piece of per-card state in this app (price, quantity, enrichment) already lives on the card, and a side table would need its own reconciliation whenever a card is removed, moved to another zone, or re-captured — for no benefit a per-card field doesn't already give for free (a removed card's `customOrder` simply disappears with it).

**Within a group, partition into "ranked" and "unranked" before rendering:** cards whose `customOrder` matches the active axis+groupKey sort by `.rank`; every other card in that same bucket (never ranked, or ranked under a different axis/group) sorts by the normal sort-axis comparator and is appended *after* the ranked cards. A group only counts as "custom-ordered" — and thus skips the sort axis for its ranked members — once at least one card in it has a matching `customOrder`. This single rule implements both "activate on first reorder" and "new arrivals appended at the end" (an unranked new arrival always sorts after every ranked card, by construction).

**Reordering is a separate, same-zone-only drag path, layered on top of the existing zone-level one — via `@dnd-kit/sortable`.** Concretely: each rendered `CardGroup` gets its own `SortableContext` (its card ids, in current display order), nested inside that zone's existing `useDroppable`. `handleDragEnd` branches on whether `event.over` resolves to a zone id (today's cross-zone `moveCard` path, unchanged) or to another card's id:
- If the dragged card's own zone differs from the target's zone → today's `moveCard` behavior (append semantics, no fine-grained position — satisfies "dragged in from elsewhere is appended at the end").
- If the dragged card's own zone matches the target card's zone *and* the dragged card's own group key matches the target card's group key → compute the new id sequence (`arrayMove`-style, using dnd-kit/sortable's own helper) and stamp a fresh `customOrder` (with the current `rank` for each position) onto every card in that resulting sequence.
- If the zones match but the group keys don't (a Creature dropped onto a card in the Land group) → no-op, same as today's "drop outside any recognized zone" scenario — a card's group is intrinsic and dragging can't change it.

Alternative considered: hand-rolling per-card droppables directly on `@dnd-kit/core` (each card row/tile as its own `useDroppable`, computing before/after from pointer position within the target's bounding box). Rejected — `@dnd-kit/sortable` exists specifically to solve "reorder within a list via drag" correctly (including the insertion-point math, the mid-drag placeholder gap, and interop with a `DragOverlay`), and hand-rolling it would be re-deriving a well-solved problem for no benefit; it composes cleanly with the existing single top-level `DndContext` and `pointerWithin` collision detection.

**Resetting is one function, called from two triggers.** A `clearCustomOrder(cards)` deck-state function strips `customOrder` from every card, deck-wide. It's called whenever the sort-axis `<select>`'s `onChange` fires (a genuine axis change already triggers this naturally) — and, for the "re-select the same axis" gesture, from the existing Name-axis `↻` resync button, generalized to also appear (and also call `clearCustomOrder`) whenever any card has a `customOrder` set, not only on the current Name/language-mismatch condition.

## Risks / Trade-offs

- **Main Deck's multi-column CSS list layout** (`c500-zone__dropzone--columns`) can visually split one group's cards across two CSS columns without changing DOM order. `@dnd-kit/sortable`'s strategies operate on the id array, not visual column position, so the *result* is still correct, but the drag-in-progress placeholder/gap indicator may look slightly disjointed when a group straddles a column break. Accepted as a minor visual quirk, not a correctness bug; worth a manual look once implemented.
- **Two overlapping drag interactions in one gesture space** (zone-level move vs. same-zone reorder) → mitigated by the explicit branch in `handleDragEnd` above; needs test coverage for all three branches (cross-zone, same-group reorder, same-zone-different-group no-op).
- **`customOrder.groupKey` drifts if a card's classification changes** (e.g., enrichment resolves after a manual reorder and the card's `primaryType` turns out different than assumed) → the stale `customOrder` simply stops matching its new bucket's key and is treated as an unranked new arrival (appended at the end) — no special-casing needed, same mechanism as the dormancy rule.

## Context

See proposal.md for motivation and the two confirmed decisions (hide the original row entirely rather than fade it in place; ship the gap preview everywhere and only special-case Main Deck's CSS multi-column List view if it turns out to actually look wrong).

Current state this builds on:
- `ZoneSection.tsx`'s header (`c500-zone__header`) renders the label, count, an optional toggle button (`onToggleCollapse &&`), and an optional filter input (`filterable && !collapsed &&`) as a flat sequence of flex children. `panel.css`'s `.c500-zone__toggle` and `.c500-zone__filter` both carry `margin-left: auto` (`panel.css:561`, `:576`), which is why they cluster together instead of anchoring independently.
- `CardRow.tsx:146` and `CardVisualTile.tsx:146` already call `useSortable({ id: card.id, data: { card } })` (added by `custom-group-order`) but destructure only `{ attributes, listeners, setNodeRef, isDragging }` — the `transform`/`transition` values `useSortable` computes are discarded.
- `.c500-card--dragging`/`.c500-tile--dragging` (`panel.css`) currently set `opacity: 0.5` on the original row/tile while `isDragging` is true; the `DragOverlay` in `TabRoot.tsx` renders a separate ghost clone.
- Each group already has its own `SortableContext` (`ZoneSection.tsx`, added by `custom-group-order`), scoped to that group's own card ids — this is what makes the gap preview naturally not leak across zones or groups (see Decisions).

## Goals / Non-Goals

**Goals:**
- One consistent header layout mechanism across all four zones, independent of which controls a given zone has.
- A live gap-opening preview during a same-group drag, using dnd-kit/sortable's existing per-item transform — no new state, no change to how the final order is committed.

**Non-Goals:**
- No change to `resolveDragOutcome`, `reorderWithinGroup`, or any commit-time logic — those already run once, at drop, and stay exactly as `custom-group-order` left them.
- No custom multi-column-aware sorting strategy written upfront — only if Main Deck's List view turns out to need one after visual verification.
- No change to what the header controls *do* (collapse/expand, filter) — only where they sit.

## Decisions

**Header becomes a 3-column CSS grid (`grid-template-columns: 1fr auto 1fr`) instead of a flex row with competing auto-margins.** Left column: name + count (natural width, left-aligned). Center column: the filter input when `filterable` is true, otherwise empty — centering it in its own column rather than trying to visually center it within a flex row alongside a variable-width left column. Right column: the toggle, `justify-self: end`. This gives every zone the same three anchor points regardless of which optional controls it has, which a flex-row-with-auto-margins fundamentally can't guarantee once more than one element wants to claim the trailing space.

**The gap preview needs no new state — it's purely `useSortable`'s existing transform, finally applied.** `@dnd-kit/sortable` computes each non-dragged item's transform by comparing its own index within its `SortableContext`'s (static) `items` array against where the active item currently sits relative to `over` — entirely internal to dnd-kit, recomputed live as the pointer moves. Our `items` array (`group.cards.map(c => c.id)`) doesn't need to change during the drag at all; it's only updated once, on drop, via the existing `reorderWithinGroup` call. Applying `style={{ transform: CSS.Transform.toString(transform), transition }}` (from `@dnd-kit/utilities`) to `CardRow`/`CardVisualTile`'s wrapper element is the entire implementation. Alternative considered: maintaining a locally-reordered "preview" list during `onDragOver` and rendering from that — rejected, since it would duplicate state dnd-kit already tracks internally and risks the preview and the eventual committed order drifting apart.

**Cross-zone and cross-group hovers naturally show no gap preview, with no extra guard needed.** A dragged item's transform is only meaningful relative to items in the *same* `SortableContext` it started in; hovering over a different zone's (or a different group's) own `SortableContext` doesn't feed back into the origin group's transform math. This falls out of already having one `SortableContext` per group (from `custom-group-order`) rather than needing an explicit "only show this within the same group" check.

**Hiding the original row is a CSS change, not a rendering change.** `.c500-card--dragging`/`.c500-tile--dragging` change from `opacity: 0.5` to something that removes it from the visual flow while dragging (e.g. `opacity: 0; pointer-events: none`, keeping it laid out so neighbors' transforms still measure correctly against a stable set of item sizes, rather than `display: none`, which would change the list's flow and could jitter the very gap-opening animation this change is adding).

## Risks / Trade-offs

- **Main Deck's CSS multi-column List view is the one layout dnd-kit's built-in sorting strategies (`verticalListSortingStrategy`, `rectSortingStrategy`) weren't written for** — both assume a plain vertical stack or a regular grid, not browser-native `column-width` reflow (top-to-bottom in one column, then wrapping to the next). Per the confirmed decision, this ships as-is and gets a specific visual check there before considering a custom strategy or disabling the live preview just in that one context.
- **Hiding the original row via `opacity: 0` rather than removing it from the DOM** keeps its layout space reserved, which is intentional (removing it would shift the very neighbors whose shift is supposed to communicate the gap) but means it's still present for measurement/accessibility purposes during the drag — screen-reader behavior here isn't a focus of this change and isn't expected to regress, but wasn't specifically audited either.

## Why

Every zone header currently bunches its collapse toggle and (where present) its name filter together via competing `margin-left: auto` rules — the toggle ends up squeezed against the filter in Main Deck/Maybeboard but floating alone in the hero zones, so it reads as inconsistently placed even though the underlying CSS rule is the same. Separately, dragging a card to reorder it within a group (per `custom-group-order`) gives no live positional feedback — the list only updates on drop, so the user can't tell where a card will land until they let go.

## What Changes

- Every zone header becomes a fixed three-region layout: name+count on the left, the name filter centered (empty region for zones without one), and the collapse/expand toggle anchored to the top-right corner — the same regions in every zone, whether or not a filter is present.
- While dragging a card within its own group, neighboring cards live-shift to open a gap at the card's current hover position, using `@dnd-kit/sortable`'s existing per-item transform (already computed by the `useSortable` calls already in place, just not applied).
- The dragged card's original row/tile is fully hidden for the duration of the drag, rather than staying visible at reduced opacity — the floating `DragOverlay` ghost becomes the only visible representation of the card being carried, and the gap left behind is now shown by neighbors shifting rather than by a dimmed placeholder sitting still.

## Capabilities

### New Capabilities
(none)

### Modified Capabilities
- `deck-organizer`: modifies "Drag visual feedback follows the cursor" (the original row/tile is hidden during drag, not just faded); adds a new requirement for the live reorder-gap preview during a same-group drag; adds a new requirement for the zone header's fixed three-region control layout.

## Impact

- `extension/src/ui/panel.css`: `.c500-zone__header` becomes a three-column grid; `.c500-card--dragging`/`.c500-tile--dragging` change from reduced opacity to fully hidden.
- `extension/src/ui/components/CardRow.tsx` and `CardVisualTile.tsx`: apply the `transform`/`transition` values `useSortable` already returns (currently destructured and discarded) to each row/tile's inline style, via `@dnd-kit/utilities`'s `CSS.Transform.toString`.
- `package.json`: promotes `@dnd-kit/utilities` from a transitive dependency (pulled in via `@dnd-kit/sortable`) to a direct one.
- No data-model or drag-resolution changes — `resolveDragOutcome`/`reorderWithinGroup` (from `custom-group-order`) already commit the final order on drop; this only adds the live, uncommitted visual preview during the drag itself.

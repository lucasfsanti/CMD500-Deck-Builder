## 1. Zone header layout

- [x] 1.1 Change `.c500-zone__header` in `panel.css` to a 3-column CSS grid (`1fr auto 1fr`), removing the `margin-left: auto` rules from `.c500-zone__toggle` and `.c500-zone__filter`; give the toggle `justify-self: end` and center the filter in its own column. Verify visually across all four zones that the toggle sits in the same corner regardless of whether a filter is present.
- [x] 1.2 Add a test (e.g. in `ZoneSection.test.tsx`) asserting the header's DOM order/structure places the toggle and filter in their respective grid regions consistently for a filterable zone (Main Deck/Maybeboard) and a non-filterable one (a hero zone) — a structural check, since jsdom doesn't compute actual grid layout.

## 2. Reorder gap preview

- [x] 2.1 Add `@dnd-kit/utilities` as a direct dependency in `package.json` (already present transitively via `@dnd-kit/sortable`).
- [x] 2.2 In `CardRow.tsx` and `CardVisualTile.tsx`, destructure `transform`/`transition` from `useSortable(...)` and apply `CSS.Transform.toString(transform)`/`transition` to the wrapper element's inline style, merged with the existing color-rail style. Verify with a component test that the rendered element's style reflects a non-null transform when `useSortable` reports one (e.g. by mocking `@dnd-kit/sortable`'s `useSortable` to return a fixed transform and asserting the DOM style).
- [x] 2.3 Verify (manually, per the confirmed decision — dnd-kit's own live transform tracking needs a real drag gesture, not something jsdom can exercise) that dragging a card within its own group shows neighbors shifting to open a gap that live-updates as the pointer moves, in both List and Visual view, and that hovering a different zone or a different group shows no such preview. Specifically check Main Deck's multi-column List view for any visual glitches from the CSS-columns interaction noted in design.md.

## 3. Hide the original row during drag

- [x] 3.1 Change `.c500-card--dragging`/`.c500-tile--dragging` in `panel.css` from `opacity: 0.5` to fully hidden (e.g. `opacity: 0; pointer-events: none`) while keeping the element's layout space reserved (not `display: none`), per design.md's reasoning about not disturbing neighbors' gap-preview measurements. Verify with a test that the dragging class is still applied when `isDragging` is true (existing behavior) and, if feasible, that its computed/inline opacity reflects the new hidden state rather than the old 0.5.

## 4. Spec alignment

- [x] 4.1 Run `openspec validate --change "zone-header-and-reorder-preview" --strict` and resolve any reported issues.

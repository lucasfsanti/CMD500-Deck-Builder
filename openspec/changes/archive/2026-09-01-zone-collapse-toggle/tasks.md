## 1. ZoneSection: collapsible rendering

- [x] 1.1 Add `collapsed?: boolean` and `onToggleCollapse?: () => void` props to `ZoneSectionProps` in `ZoneSection.tsx`. Render a chevron icon-button toggle in the zone header (after the count, before the filter input when present), with `aria-expanded={!collapsed}` and a zone-specific `aria-label`. Verify with a test that the toggle renders with the correct `aria-expanded`/`aria-label` for both states.
- [x] 1.2 When `collapsed` is true, do not render the groups content or the filter input, but keep the `.c500-zone__dropzone` div (and its `useDroppable` ref) mounted. Verify with tests: collapsed hides card rows/tiles and the filter input; expanded (or `collapsed` omitted) renders them as today; the dropzone element itself is still present (by node/ref, not just class) while collapsed.
- [x] 1.3 Add a `c500-zone__dropzone--collapsed` class (alongside the existing `--active`/`--visual`/`--columns` modifiers) applied when `collapsed` is true, and give it a modest min-height in `panel.css` — enough to stay a comfortable drop target, distinct from the near-zero-height a fully-hidden element would have. Verify visually that a collapsed zone remains large enough to drop a card onto.

## 2. TabRoot: lifted collapse state and auto-expand-on-drop

- [x] 2.1 Add `collapsedZones` state (`useState<ReadonlySet<Zone>>(new Set())`) and a `toggleZoneCollapsed(zone)` function to `TabRoot.tsx`; pass `collapsed={collapsedZones.has(zone)}` and `onToggleCollapse={() => toggleZoneCollapsed(zone)}` to all four `ZoneSection` instances (Comandante, Comandante Parceiro, Maybeboard, Main Deck). Verify with a test that clicking a zone's toggle collapses only that zone, leaving the other three unaffected.
- [x] 2.2 In `handleDragEnd`, when `resolveDragOutcome` returns `{ kind: "move", toZone, ... }`, also remove `toZone` from `collapsedZones` (expand it) before or alongside calling `moveCard`. Verify with a test: collapse a zone, simulate a drop resolving to a move into that zone, and confirm it renders expanded afterward.
- [x] 2.3 Verify every zone starts expanded on a fresh render (no persistence) — confirm no `useEffect`/storage read was added for this state, and add a test asserting all four zones render expanded on initial mount.

## 3. Spec alignment

- [x] 3.1 Run `openspec validate --change "zone-collapse-toggle" --strict` and resolve any reported issues.

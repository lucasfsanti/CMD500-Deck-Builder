## Why

`deck-organizer`'s "Zone header control layout" requirement already specifies that a zone's name, its filter (when present), and its collapse/expand toggle render as three fixed regions in one row. The shipped implementation (`2026-09-02-zone-header-and-reorder-preview`) intended exactly that with a 3-column CSS grid, but a CSS Grid auto-placement quirk pushes the filter input onto its own second row instead — confirmed against a live screenshot of Maybeboard's header, where "Filtrar por nome…" renders below the "Maybeboard (85)" / collapse-toggle row rather than beside them. The already-correct spec is not being met by the code.

## What Changes

- Fix `.c500-zone__title`, `.c500-zone__toggle`, and `.c500-zone__filter` in `extension/src/ui/panel.css` so all three reliably render in the same header row, regardless of DOM order.

**BREAKING**: none — visual-only fix, no markup, data, or behavior change.

## Capabilities

No spec-level behavior changes — `deck-organizer`'s "Zone header control layout" requirement already describes the correct, intended behavior; this change makes the implementation match it. `skip_specs: true` is set in `.openspec.yaml` accordingly.

### New Capabilities
(none)

### Modified Capabilities
(none)

## Impact

- **Code**: `extension/src/ui/panel.css` only (`.c500-zone__title`, `.c500-zone__toggle`, `.c500-zone__filter` rules, around lines 550-614). No changes to `ZoneSection.tsx` or any other component.
- **Tests**: none of the existing unit tests exercise real CSS Grid layout (Vitest + jsdom doesn't compute grid placement), so this bug was invisible to `npm test` — no regression test is added for the same reason; verification is visual only.

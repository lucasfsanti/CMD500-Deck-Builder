## Context

See proposal.md for motivation and the four confirmed decisions (accordion collapse; all four zones; session-only state; per-zone toggles only, no collapse-all).

Current state this builds on (`extension/src/ui/components/ZoneSection.tsx`, `extension/src/tab/TabRoot.tsx`):
- `ZoneSection` already mixes two state-ownership patterns: cross-cutting display state (`viewMode`, `groupingAxis`, `sortAxis`, `sortNameLanguage`) is owned by `TabRoot` and passed down as props; the per-zone name filter (`filterText`) is deliberately kept as `ZoneSection`'s own local `useState`, per its existing comment, because "nothing outside this zone's own render needs its filter text."
- The zone's droppable ref (`useDroppable({ id: zone })`, `ZoneSection.tsx:111`) is attached to the same `<div className="c500-zone__dropzone">` that currently wraps the rendered groups directly (`ZoneSection.tsx:147-200`).
- `heroEmpty` (`ZoneSection.tsx:128`) already drives a `c500-zone--hero-empty` class, independent of anything the new toggle introduces.
- `TabRoot.tsx`'s `handleDragEnd` calls `resolveDragOutcome` (from `resolve-drop.ts`, added by `custom-group-order`) and dispatches on its `kind` (`"move" | "reorder" | "noop"`).

## Goals / Non-Goals

**Goals:**
- A card dropped into a collapsed zone must actually be able to land there (the droppable ref can never be unmounted while collapsed) and the zone must visibly expand so the result is visible.
- Each zone's collapse state is independent of the other three.

**Non-Goals:**
- No persistence (already decided: session-only).
- No collapse-all/expand-all control (already decided: per-zone only).
- No change to the automatic empty-Companheiro shrink — it stays exactly as it is, orthogonal to the new manual toggle.

## Decisions

**Collapse state is lifted to `TabRoot`, not kept local to `ZoneSection` like the filter text is.** Concretely: `const [collapsedZones, setCollapsedZones] = useState<ReadonlySet<Zone>>(new Set())` in `TabRoot`, with a `toggleZoneCollapsed(zone)` function flipping membership, passed to every `ZoneSection` as `collapsed={collapsedZones.has(zone)}` / `onToggleCollapse={() => toggleZoneCollapsed(zone)}`. This is the one point where this feature's needs diverge from the filter-text precedent: auto-expand-on-drop requires `handleDragEnd` (which lives in `TabRoot`) to be able to force a *specific* zone's collapsed state to false from outside, on a `"move"` outcome — `setCollapsedZones(prev => { const next = new Set(prev); next.delete(outcome.toZone); return next; })`. A local-only `ZoneSection` state would need some other signal prop threaded down anyway to achieve the same effect, which is more indirection for no benefit; lifting the state outright reuses the same pattern already established for `viewMode`/`groupingAxis`/`sortAxis`.

**The droppable ref never unmounts; only its children conditionally render.** `ZoneSection`'s existing `.c500-zone__dropzone` div keeps `ref={setNodeRef}` regardless of `collapsed`; only the `groups.map(...)` content (and, for `filterable` zones, the filter `<input>`) renders conditionally on `!collapsed`. A `c500-zone__dropzone--collapsed` class gives it a modest fixed min-height in CSS (not zero), so it stays a comfortable, easy-to-hit drop target rather than shrinking to a sliver. Alternative considered: unmounting the dropzone entirely and moving the droppable registration to the outer `<section>` — rejected, since it would require a second, separate droppable id/ref just for the collapsed case, more moving parts than conditionally rendering one div's children.

**The toggle is a single icon button in the header, present on all four zones uniformly.** Reuses this codebase's existing icon-button convention (see `ListIcon`/`GridIcon`/`SunIcon`/`MoonIcon` in `TabRoot.tsx`): a chevron SVG, `aria-expanded={!collapsed}`, `aria-label` naming the zone ("recolher Main Deck" / "expandir Main Deck"). Placed in `ZoneSection`'s existing header `<div>`, after the count and before the filter input (when present).

**`heroEmpty` and `collapsed` are independent CSS modifier classes on the same `<section>`**, e.g. `c500-zone--hero c500-zone--hero-empty c500-zone--collapsed` can all apply at once. No interaction logic needed: an empty, expanded hero zone shows today's slim hint; an empty, manually-collapsed hero zone shows the collapsed header-only treatment; both look minimal for the same underlying reason (nothing to show), without either state needing to know about the other.

## Risks / Trade-offs

- **`TabRoot`'s prop surface grows by two more values per `ZoneSection` call site (×4)** → mitigated by passing one shared `Set<Zone>` plus one shared toggle function, not four separate booleans/callbacks.
- **Exact "comfortable" min-height for a collapsed dropzone is a visual-polish judgment call**, not something the spec pins down numerically — left to implementation/CSS, verified by manual inspection the same way other visual-only aspects of this app already are.
- **Collapse state resets every reload (per the confirmed decision)** — a user who always collapses Maybeboard re-collapses it every session. Accepted; matches `viewMode`/`groupingAxis`/`sortAxis`'s existing behavior.

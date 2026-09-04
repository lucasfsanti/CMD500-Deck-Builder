## Context

See proposal.md - Why for the bug and how it was confirmed. Relevant current-state facts:

- `.c500-zone__header` (`panel.css:550`) is `display: grid; grid-template-columns: 1fr auto 1fr;` with no explicit `grid-template-rows` or `grid-auto-rows`.
- `.c500-zone__title`, `.c500-zone__toggle`, `.c500-zone__filter` each set `grid-column` (1, 2, 3 respectively — note the filter is column 2, the toggle is column 3) but none sets `grid-row`.
- `ZoneSection.tsx` renders these three elements in DOM order: title, then the collapse/expand toggle (`onToggleCollapse && <button>`), then the filter input (`filterable && !collapsed && <input>`).
- CSS Grid's sparse auto-placement algorithm assigns an implicit row to any item whose `grid-row` is unset, by walking items in DOM order and advancing a placement cursor that only moves forward (never back to an earlier row once passed). With this DOM order, the toggle (column 3) gets placed before the filter (column 2) is considered, which advances the cursor past row 1 by the time the filter is placed — pushing the filter to row 2, even though row 1's column 2 was free the whole time.

## Goals / Non-Goals

**Goals:**
- All three header controls render in the same row (row 1) regardless of which optional controls a given zone has, or what order they appear in the DOM.
- The fix addresses the actual mechanism (unset `grid-row`), not just this specific DOM-order instance of it, so a future zone header change (e.g., adding a fourth optional control) doesn't reintroduce the same bug.

**Non-Goals:**
- No change to what the header controls do, their column assignment, or their visual styling beyond the row fix.
- No change to `ZoneSection.tsx` — the fix is CSS-only.
- No automated regression test — see proposal.md - Impact for why (jsdom doesn't compute real Grid layout).

## Decisions

**Fix by adding `grid-row: 1` to all three header-control rules, not by reordering the JSX.** Two options were available:
1. Add `grid-row: 1;` to `.c500-zone__title`, `.c500-zone__toggle`, and `.c500-zone__filter`, pinning all three to row 1 explicitly.
2. Reorder `ZoneSection.tsx`'s JSX so the filter renders before the toggle (title → filter → toggle), which happens to also avoid the cursor-advancement problem for this specific 3-item case.

Went with (1). Option (2) only works because the reordered DOM sequence happens to match ascending column order (1, 2, 3) — it fixes the symptom for this exact set of three controls, but the underlying cause (relying on implicit row placement at all) remains, and would resurface the moment a future change adds another optional control between two existing ones in a DOM order that doesn't already match column order. Option (1) fixes the actual mechanism: with every control explicitly pinned to row 1, DOM order becomes irrelevant to row placement.

## Risks / Trade-offs

- **[Risk]** No automated test catches a regression of this specific bug, since it's a real-layout (CSS Grid) behavior jsdom doesn't compute. → **Mitigation:** the fix is a two-line, low-complexity CSS addition (`grid-row: 1` × 3) with an obvious visual verification (open the tab view, confirm the filter sits beside the title/toggle, not below); the cost of a missing automated test here is judged lower than the cost of building real-layout test infrastructure for one rule.

## Migration Plan

CSS-only change, no data or state migration. Deploy is the next `npm run build` + extension reload; rollback is a plain revert.

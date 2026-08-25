## Context

Five independent UI/UX fixes bundled into one change (see proposal.md - Why). The codebase is a Chrome extension (React + TypeScript, Vitest/jsdom tests, no backend) driving a single full-tab deckbuilder view (`TabRoot.tsx`) over data captured from LigaMagic deck pages. `@dnd-kit/core` is already the only drag-and-drop dependency; no `DragOverlay` or custom `collisionDetection` is currently configured on `<DndContext>` — `useDraggable` is used, but its `transform` is never applied to the dragged node, so nothing visually tracks the cursor today.

## Goals / Non-Goals

**Goals:**
- Fix all five items with the smallest change to each subsystem's existing shape (mirror `calculate-budget.ts`'s pattern for the 99-cap; mirror `CardVisualTile`'s artwork-resolution logic for the hover preview).
- Keep the four-zone model consistent end-to-end: capture, organizer, export, budget, analytics, legality.

**Non-Goals:**
- No i18n/locale-switching infrastructure — Portuguese is hardcoded, not a selectable locale (see proposal.md).
- No backend or persistence changes — all five items are client-side/extension-local.
- No change to Scryfall enrichment, banlist data, or the capture pipeline's price/artwork extraction beyond zone mapping.

## Decisions

### Drag ghost + pointer-accurate drop targeting: `DragOverlay` + `pointerWithin`
Add `@dnd-kit/core`'s `<DragOverlay>` to `TabRoot.tsx`, rendering a clone of the active card (`CardRow` or `CardVisualTile`, chosen by the active view mode) at `opacity: 0.85` or similar. `DragOverlay`'s default positioning already preserves the offset between the grab point and the element — no `snapCenterToCursor` modifier needed, since the requirement is "the grabbed point tracks the cursor," not "the element's center tracks the cursor."

Set `<DndContext collisionDetection={pointerWithin}>` (a built-in `@dnd-kit/core` strategy) instead of the default `rectIntersection`. `rectIntersection`/`closestCenter` resolve the drop target from the dragged element's *entire translated bounding box* against candidate zone rects — for a tall Visual-mode tile grabbed near its bottom edge, that box extends well above the cursor, so the resolved zone can silently differ from the zone visually under the pointer. `pointerWithin` hit-tests the literal pointer coordinate against droppable rects instead, which is what "the drop target should track the cursor" means concretely — and it's a straight swap, no new dependency.

While an item is being dragged, hide the original node's content (or keep the existing `opacity: 0.5` dim) so the same card isn't rendered twice (once in place, once as the overlay).

*Alternative considered*: `closestCenter` with a `snapCenterToCursor` modifier — rejected because it changes the drag semantics to "tile center follows cursor regardless of grab point," which isn't what was reported as broken (the grab-point offset should be preserved, matching ordinary OS drag-and-drop).

### Sideboard removal: fold at the capture boundary, not downstream
Change `zoneForHeaderLabel`'s `"Sideboard"` mapping (`zone-labels.ts`) to resolve to `"maybeboard"` instead of a `"sideboard"` value that no longer exists, then delete `"sideboard"` from `ZONES`/`Zone` (`types.ts`). Folding at this single boundary means `deck-page-parser.ts`'s fallback-zone logic, `resolve-drop.ts`, `moveCard`, `calculate-budget.ts`, and `bucket-counts.ts` need no behavioral changes — they already operate generically over `ZONES` or already excluded `sideboard`. Only `ZoneSection.tsx`'s `ZONE_LABELS` map and `generate-decklist.ts`'s zone-block logic (both of which hardcode the zone list) need edits, since a zone disappearing from the type is a compile error at every `Record<Zone, ...>` site — the compiler finds the rest.

*Alternative considered*: keep `sideboard` in the `Zone` type but hide it from the UI only — rejected because it leaves a zone LigaMagic can still populate invisible to the user (the exact silent-data-loss risk raised during exploration), and doesn't remove the now-dead "Sideboard" concept from export/budget/analytics wording.

### Hover preview: local component state, no portal
Add hover state (`useState<{x,y} | null>`) directly in `CardRow`, driven by `onPointerEnter`/`onPointerMove`/`onPointerLeave` on the existing row element — these are independent of the `useDraggable` `listeners` already spread onto the row (drag start requires a move-past-threshold after pointerdown; hover events don't conflict). Render a `position: fixed` preview div anchored to the tracked pointer coordinates, reusing `CardVisualTile`'s artwork-resolution (`pageImageUrl ?? enrichment?.imageUrl`) and placeholder styling for parity. Suppress the preview while `isDragging` (from the same `useDraggable` call) so it never overlaps the new drag ghost.

*Alternative considered*: a portal rendered from `TabRoot` tracking whichever card id is hovered — rejected as unnecessary indirection; `position: fixed` escapes any scrolling ancestor without a portal, and keeping the hover state local to `CardRow` avoids adding hover-tracking plumbing to `TabRoot`/`ZoneSection` for a List-view-only feature.

### 99-card cap: sibling module to `calculate-budget.ts`, not a shared abstraction
Add `extension/src/lib/organizer/calculate-card-count.ts` with its own `CARD_COUNT_CAP = 99` and a zone-scope check matching `isBudgetCounted`'s zone set (`mainDeck`, `comandanteParceiro`) but *without* the basic-land exclusion (basic lands occupy real deck slots under Commander's rules, unlike their near-zero budget contribution). This duplicates a two-item zone `Set` rather than extracting a shared "counted zones" helper — the two checks read the same zones for different reasons (price relevance vs. deck-slot occupancy) that could diverge later (e.g. if a alternate format ever counted differently), and the duplication is one line.

Surface it as a new small gauge component next to `BudgetGauge` in `TabRoot.tsx`'s sidebar, visually mirroring its over-cap/under-cap treatment (see `budget-tracking`'s existing CSS classes as the pattern to follow, e.g. `c500-card__price--over-budget`'s color treatment).

### Localization: hardcoded strings, translated in place
No `i18n` library, no message-catalog file. Every user-facing string literal in `extension/src/ui/**`, `extension/src/tab/TabRoot.tsx`, and the existing label maps (`FORMAT_LABELS`, `ZONE_LABELS`, `GROUPING_AXIS_LABELS`) is translated directly at its call site. `README.md` and `extension/README.md` are translated in full, including the developer-facing sections (Setup, Playwright verify scripts) — the proposal treats "README files" as unqualified.

## Risks / Trade-offs

- **[Risk]** Translating `extension/README.md`'s developer-facing sections (Playwright scripts, banlist-update steps) makes the repo less approachable to a non-Portuguese-speaking contributor. → Accepted per explicit proposal scope ("Both the UI and the README files should be in Brazilian Portuguese... in full"); not a decision left open here.
- **[Risk]** `pointerWithin` behaves differently from `rectIntersection` at zone edges when no droppable rect actually contains the pointer (e.g. a drop in the gap between two zone sections). → `resolveDropZone` already returns `undefined` for "no valid target," which is the existing, tested "drop outside any recognized zone" path (`deck-organizer` spec) — no new fallback needed.
- **[Risk]** Existing tests assert English strings, the five-zone model, and Sideboard-specific fixtures/scenarios (`deck-state.test.ts`, `resolve-drop.test.ts`, `generate-decklist.test.ts`, `deck-page-parser.test.ts`, several component tests). → These need updating alongside the corresponding source change, tracked per-area in tasks.md rather than as a single catch-all pass, so a broken test points at the specific area that regressed.
- **[Trade-off]** Duplicating the "counted zones" set between `calculate-budget.ts` and `calculate-card-count.ts` instead of sharing a helper. → Deliberate; see Decisions above.

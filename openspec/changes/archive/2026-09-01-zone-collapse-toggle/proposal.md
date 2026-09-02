## Why

The deck view always renders every zone's full card list, even when the user only cares about one zone right now (e.g. arranging Main Deck while Maybeboard and the commander hero block just take up scroll space). Letting the user collapse a zone down to just its header reduces clutter without losing any of the zone's own data (its card count stays visible either way).

## What Changes

- Every zone (Comandante, Comandante Parceiro, Main Deck, Maybeboard) gets a collapse/expand toggle on its own header, independent of the other three zones.
- Collapsing a zone hides its card list (and, for Main Deck/Maybeboard, its name filter) while keeping the header, card count, and any zone-level error message visible.
- A collapsed zone remains a valid drag-and-drop target: dropping a card into it still moves the card there, and the drop auto-expands that zone so the user sees where the card landed.
- Collapse/expand state is session-only (plain component state, not persisted) — every zone starts expanded on a fresh tab load, matching how view mode, grouping axis, and sort axis already behave, not how theme/name-language (chrome.storage-backed) do.
- The existing automatic "Companheiro shrinks to a slim hint when empty" behavior is unaffected — it applies regardless of the manual toggle's state.
- No global "collapse all"/"expand all" control — per-zone toggles only.

## Capabilities

### New Capabilities
(none)

### Modified Capabilities
- `deck-organizer`: adds a new requirement for the per-zone collapse/expand toggle; modifies "Drag-and-drop card movement between zones" so a collapsed target zone still accepts a drop and auto-expands.

## Impact

- `extension/src/ui/components/ZoneSection.tsx`: new collapsed/expanded local state, a toggle control in the header, conditional rendering of the card-list body (and filter input) while keeping the droppable ref mounted so cross-zone drag-and-drop into a collapsed zone keeps working.
- `extension/src/tab/TabRoot.tsx`: pass through whatever drop-outcome signal `ZoneSection` needs to auto-expand itself when a card lands in it while collapsed.
- `extension/src/ui/panel.css`: collapsed-state styling — hides the body, keeps a modest minimum-height dropzone (not zero) so it stays a comfortable drop target, distinct from the existing empty-Companheiro slim-hint styling.

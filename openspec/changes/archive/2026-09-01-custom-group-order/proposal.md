## Why

Within a group, card order today is 100% derived from the active sort axis (Mana Value/Name/Color/Price) — there's no way for a user to arrange cards the way they personally want (e.g. combo pieces next to each other, or a preferred play-pattern sequence) without that arrangement being wiped out on every render. Dragging a card and dropping it back in its own zone is currently a documented no-op. Letting a drag-and-drop reorder within a group take effect, and stick, closes that gap.

## What Changes

- Dragging a card and dropping it at a specific position among other cards in the same group (Main Deck or Maybeboard only — Comandante/Comandante Parceiro have no groups to reorder within) sets a custom order for that entire group: every card in the group is stamped with the sequence it's in at that moment.
- Once a group has a custom order, it renders in that order instead of being sorted by the active sort axis — until the order is explicitly reset (see below). This applies identically in List and Visual view, since both render from the same grouped data.
- Switching the **grouping** axis (Type/Color/CMC) doesn't discard any custom order — it just doesn't apply to groups formed under a different axis, since group membership is a different partition entirely. Switching back re-applies whatever custom order those original groups still carry.
- Selecting a genuinely different **sort** axis clears every group's custom order deck-wide, reverting everything to that axis's ordering. Re-selecting the sort axis that's already active does the same, via the same generalized "resync" affordance the Name-axis toggle already uses (`↻`) — now shown whenever any group has a custom order, not only on a Name/language mismatch.
- A card that lands in an already-custom-ordered group later (dragged in from elsewhere, or newly captured into that group) is appended at the end of that group's custom order.
- **BREAKING (UX only)**: dropping a card back into its own zone is no longer always a no-op — it can now reorder within a group.

## Capabilities

### New Capabilities
(none)

### Modified Capabilities
- `deck-organizer`: "Grouping and sorting within a zone" gains custom-order precedence over the sort axis; "Drag-and-drop card movement between zones" gains within-group reordering (previously same-zone drops were a no-op); a new requirement covers activating, dormancy across grouping-axis switches, and resetting custom order.
- `card-visual-view`: "Visual view preserves existing per-card functionality" gains within-group drag-reorder as a Visual-view-parity item, same as drag-and-drop, quantity editing, and removal already are.

## Impact

- `extension/src/lib/deck/types.ts`: `DeckCard` gains an optional `customRank?: number` (or equivalent ordinal) field.
- `extension/src/lib/organizer/group-sort.ts`: `sortWithinGroup` prefers `customRank` ordering over the active sort axis whenever any card in the group has one set.
- A new state-layer function (alongside `moveCard`/`setCardQuantity`/`setCardPrice`/`removeCard` in `deck-state.ts`) that, given a group's cards and a new position for one of them, stamps a fresh sequence onto every card in that group.
- A new function clearing every card's `customRank` deck-wide, wired to both a genuine sort-axis change and the generalized resync affordance.
- Drag-and-drop mechanics: introduces per-card drop targets within a group, most naturally via adopting `@dnd-kit/sortable` (not currently a dependency; today's drag-and-drop uses `@dnd-kit/core` only, with each zone as a single droppable and no per-card insertion point).
- `extension/src/ui/components/ZoneSection.tsx`, `CardRow.tsx`, `CardVisualTile.tsx`, `TabRoot.tsx`: wire the new per-card drop targets and the generalized resync control.

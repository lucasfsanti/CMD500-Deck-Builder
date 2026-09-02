# deck-organizer Specification

## Purpose

Presents the captured decklist as an editable, zone-based deck view — grouping and sorting cards within each zone and letting the user move cards between zones by drag-and-drop.

## Requirements

### Requirement: Four deck zones
The deck view SHALL organize cards into exactly four zones: Comandante, Comandante Parceiro, Main Deck, and Maybeboard, matching LigaMagic's own zone model, with Sideboard folded into Maybeboard at capture time rather than kept as its own zone.

#### Scenario: Captured deck has cards in all four zones
- **WHEN** the captured decklist includes cards assigned to each of the four zones
- **THEN** the deck view renders four distinct zone sections, each showing only the cards assigned to it

### Requirement: Grouping and sorting within a zone
Within each zone, the deck view SHALL group cards by a user-selectable grouping axis — card type (the default), color identity, or converted mana cost — applying to all zones at once. Groups SHALL appear in the active axis's own natural order (card type order, WUBRG color order, or ascending mana cost). Within a group, cards SHALL be sorted by a separate user-selectable sort axis — mana value (the default, ascending), name (alphabetical), color identity (colorless/W/U/B/R/G/multicolor order), or price in R$ (descending, highest first) — applying to all zones at once, with name used as a tiebreak whenever the sort axis does not fully order two cards. A card whose price has not resolved SHALL sort after every priced card when the sort axis is price. A group that has been given a custom order (see "Custom group order overrides the sort axis") SHALL render in that order instead of being sorted by the active sort axis, until the custom order is reset.

When the sort axis is Name, alphabetical ordering SHALL use whichever name-language (English or Portuguese, per `card-name-language`) was active at the moment the user selected — or most recently re-selected — the Name sort axis. A later change to the name-language toggle SHALL NOT re-sort a zone already sorted by Name; the order only updates on the next interaction with the sort-axis control, including re-selecting Name while it is already active. The name used as a tiebreak for every other sort axis (mana value, color, price) SHALL always be each card's canonical English name, regardless of the name-language toggle.

#### Scenario: Main Deck contains creatures and instants of varying CMC
- **WHEN** the Main Deck zone contains a mix of creature and instant cards with different mana values, with the grouping axis set to Type (the default) and the sort axis set to Mana Value (the default)
- **THEN** creatures and instants render as separate type groups, and within each type group cards are ordered by ascending mana value and then by canonical English name

#### Scenario: User switches the grouping axis to Color
- **WHEN** the user sets the grouping axis to Color
- **THEN** every zone re-renders grouped by color identity instead of type, with groups ordered colorless/W/U/B/R/G/multicolor (the same color-identity order deck-analytics's color chart already uses), cards within each group without a custom order still ordered by the active sort axis

#### Scenario: User switches the grouping axis to Mana Cost
- **WHEN** the user sets the grouping axis to Mana Cost
- **THEN** every zone re-renders grouped by converted mana cost (ascending) instead of type, with cards within each group without a custom order still ordered by the active sort axis

#### Scenario: User switches the sort axis to Price
- **WHEN** the user sets the sort axis to Price
- **THEN** every zone re-renders with cards within each group without a custom order ordered by descending price (highest R$ first), cards with an unresolved price ordered after all priced cards, then by canonical English name

#### Scenario: User switches the sort axis to Name or Color
- **WHEN** the user sets the sort axis to Name or Color
- **THEN** every zone re-renders with cards within each group without a custom order ordered alphabetically by whichever name-language was active at the moment Name was selected, or by color identity in colorless/W/U/B/R/G/multicolor order respectively, using each card's canonical English name as the tiebreak either way

#### Scenario: User toggles name-language after sorting by Name
- **WHEN** a zone is sorted by Name and the user then switches the name-language toggle
- **THEN** that zone's sort order does not change until the user interacts with the sort-axis control again

#### Scenario: User re-selects Name after toggling name-language
- **WHEN** a zone is sorted by Name, the user switches the name-language toggle, and then re-selects Name in the sort-axis control (even though Name was already selected)
- **THEN** the zone re-sorts using the newly active name-language

#### Scenario: Non-name sort axis tiebreak ignores the name-language toggle
- **WHEN** the sort axis is Mana Value, Color, or Price and two cards tie on that axis
- **THEN** the tie is broken using the cards' canonical English names, regardless of the active name-language toggle

### Requirement: Drag-and-drop card movement between zones
The user SHALL be able to move a card from one zone to another by dragging it, and the move SHALL be reflected immediately in the organizer's grouping, the budget total, and the legality check. In Main Deck or Maybeboard, dragging a card and dropping it at a specific position among other cards within its own current group SHALL reorder that group into a custom order instead of moving the card to a different zone. A collapsed zone SHALL remain a valid drop target: dropping a card onto it SHALL move the card there the same as an expanded zone would, and SHALL expand that zone so the user sees the result.

#### Scenario: User drags a card from Maybeboard to Main Deck
- **WHEN** the user drags a card from the Maybeboard zone and drops it on the Main Deck zone
- **THEN** the card is removed from Maybeboard, added to Main Deck under its correct group for the active grouping axis, and the budget and legality panels update to reflect the move

#### Scenario: User drags a card onto an invalid target
- **WHEN** the user drags a card and drops it outside any recognized zone
- **THEN** the card remains in its original zone and no state change occurs

#### Scenario: User reorders a card within its own group
- **WHEN** the user drags a card in Main Deck or Maybeboard and drops it at a different position among the other cards in its own group
- **THEN** the card moves to that position within the group and no zone change occurs

#### Scenario: User drops a card onto a collapsed zone
- **WHEN** the user drags a card and drops it onto a zone that is currently collapsed
- **THEN** the card moves into that zone the same as it would if the zone were expanded, and the zone expands so the moved card is visible

### Requirement: Drag visual feedback follows the cursor
While a card is being dragged, the deckbuilder SHALL show a semi-transparent ghost of that card positioned so the point the user grabbed it remains under the pointer; the ghost SHALL disappear when the drag ends. The card's original row or tile SHALL be fully hidden for the duration of the drag — the ghost is the only visible representation of the card being carried — reappearing in its resolved position once the drag ends.

#### Scenario: User drags a card in List view
- **WHEN** the user presses and drags a card row
- **THEN** a semi-transparent ghost of that row follows the pointer for the duration of the drag

#### Scenario: User grabs a Visual-mode tile away from its center
- **WHEN** the user grabs a Visual-view artwork tile near its bottom edge and drags it
- **THEN** the ghost's grabbed point stays under the pointer throughout the drag, not the tile's overall bounding-box center

#### Scenario: The original row is hidden while its ghost is dragged
- **WHEN** a card is being dragged
- **THEN** its original row or tile is not visible anywhere else on screen — only the ghost following the pointer represents it — until the drag ends

### Requirement: Reorder preview opens a gap in the list
While the user drags a card over a different position within its own group (Main Deck or Maybeboard, per `custom-group-order`), the cards between the dragged card's original position and its current hover position SHALL shift to open a gap at the position the card would land in if dropped there. This preview SHALL update live as the pointer moves, and SHALL apply in both List and Visual view. It SHALL NOT apply while hovering over a different zone or a different group within the same zone, since a cross-zone or cross-group drop does not use a specific position.

#### Scenario: User drags a card past its neighbors within a group
- **WHEN** the user drags a card over a different position among the other cards in its own group
- **THEN** the intervening cards shift to leave a gap at the card's current hover position, updating live as the pointer moves

#### Scenario: No gap preview across zones or groups
- **WHEN** the user drags a card over a different zone, or over a different group within the same zone
- **THEN** no gap-opening preview is shown, since the drop will not use a specific position there

#### Scenario: Gap preview resolves to the actual drop position
- **WHEN** the user releases a card over a position that showed a gap preview
- **THEN** the card lands in that same position, matching what the preview showed

### Requirement: Drop-target resolution follows the pointer
The zone a dragged card is dropped into SHALL be determined by the pointer's position when the drag ends, not by the dragged card's overall bounding-box overlap with candidate zones, so the zone that visually highlights as the drop target matches what is under the user's cursor regardless of where on the card they grabbed it.

#### Scenario: Card grabbed away from its center is dropped near a zone boundary
- **WHEN** the user grabs a card away from its center and releases it with the pointer over a specific zone
- **THEN** the card moves into the zone the pointer was actually over, not a neighboring zone the card's bounding box happened to overlap

### Requirement: Commander zone cardinality
The Comandante zone SHALL accept a single card unless a legal partner-commander pair is present, in which case the Comandante Parceiro zone holds the second card; the organizer SHALL prevent placing more cards in Comandante/Comandante Parceiro than the format allows.

#### Scenario: User drags a second, non-partner card into Comandante
- **WHEN** the Comandante zone already holds a commander without the partner keyword and the user drags another card onto Comandante
- **THEN** the drop is rejected and the user sees a message explaining only a partner commander may be added

### Requirement: Manual quantity edits stay grouped correctly
Only basic land cards SHALL expose an editable quantity control; non-basic cards SHALL NOT. That control SHALL be a stepper: a typeable quantity field flanked by an increment ("+1") and a decrement ("−1") button, in both List and Visual view. When the user changes a basic land's quantity by any means — typing a new value or using the +/− buttons — the organizer SHALL keep the card in its correct group for the active grouping axis and update dependent totals. Reaching a quantity of 0 by any means SHALL remove the card from the deck entirely, the same way its dedicated removal control does, rather than leaving a visible 0-quantity row.

#### Scenario: User increases a Main Deck card's quantity
- **WHEN** the user edits a basic land's quantity field in the Main Deck zone
- **THEN** the card stays in its existing group, the displayed quantity updates, and the budget total recomputes using the new quantity

#### Scenario: User clicks the increment button
- **WHEN** the user clicks a basic land's "+" button
- **THEN** its quantity increases by 1 and dependent totals update the same way a typed edit would

#### Scenario: User clicks the decrement button above quantity 1
- **WHEN** the user clicks a basic land's "−" button while its quantity is 2 or more
- **THEN** its quantity decreases by 1 and dependent totals update the same way a typed edit would

#### Scenario: User clicks the decrement button at quantity 1
- **WHEN** the user clicks a basic land's "−" button while its quantity is 1
- **THEN** the card is removed from the deck entirely, the same way its removal control would remove it

#### Scenario: User types 0 into the quantity field
- **WHEN** the user types 0 directly into a basic land's quantity field and commits it
- **THEN** the card is removed from the deck entirely, the same way its removal control would remove it

#### Scenario: Non-basic card has no quantity field
- **WHEN** a non-basic card renders in any zone, in either List or Visual view
- **THEN** no editable quantity control is shown for it

### Requirement: Non-basic card quantity is normalized to one
A non-basic card's quantity SHALL always be treated as 1, regardless of what value the source LigaMagic page reported, including on any later re-sync from the source page.

#### Scenario: Captured page reports more than one copy of a non-basic card
- **WHEN** the captured LigaMagic page shows a quantity greater than 1 for a non-basic card
- **THEN** the organizer treats that card's quantity as 1, and dependent totals (budget, card count) are computed using 1

#### Scenario: A later re-sync from the source page still reports a stale quantity
- **WHEN** the deck re-syncs from its source LigaMagic page and the page still reports more than one copy of a non-basic card
- **THEN** the re-synced card's quantity is again normalized to 1

### Requirement: Explicit card removal
The user SHALL be able to remove any card from the deck entirely via a dedicated control on that card, distinct from moving it between zones, EXCEPT the primary Comandante, which SHALL NOT expose a removal control — the format's defining card is corrected by dragging it out to another zone and dragging the intended commander into the now-empty Comandante, not by deleting it outright. Everywhere else, the control SHALL be hidden until the card is hovered, and activating it SHALL take effect immediately, updating dependent totals (budget, card count, legality) the same way a zone move does.

#### Scenario: User removes a card from a zone
- **WHEN** the user hovers a card in any zone other than Comandante and activates its removal control
- **THEN** the card no longer appears in any zone, and the budget, card count, and legality panels update to reflect its absence

#### Scenario: Comandante has no removal control
- **WHEN** the user hovers the card in the Comandante zone
- **THEN** no removal control appears for it

#### Scenario: Removal control stays hidden until hovered
- **WHEN** a removable card is not hovered
- **THEN** its removal control is not visible

#### Scenario: Removal control does not trigger drag
- **WHEN** the user activates a removal control on a card
- **THEN** no drag-and-drop move is triggered by that interaction

### Requirement: Per-zone name filter in Main Deck and Maybeboard
Each of the Main Deck and Maybeboard zones SHALL offer its own independent text filter control. While the user has typed text into a zone's filter, that zone SHALL show only cards whose canonical English name or Portuguese display name contains the typed text (case-insensitive), regardless of which name-language is currently displayed, and SHALL hide any group under the active grouping axis left with no matching cards. Typing into one zone's filter SHALL NOT change what the other zone shows. Clearing a zone's filter text SHALL restore all of that zone's cards. The filter SHALL NOT apply to the Comandante or Comandante Parceiro zones. A card being hidden by the filter SHALL NOT change the budget total, card count, or legality check, all of which SHALL continue to reflect the full, unfiltered deck.

#### Scenario: User filters Main Deck by name
- **WHEN** the user types a substring into the Main Deck zone's filter
- **THEN** Main Deck shows only cards whose name contains that substring, and any group left with no matching cards is hidden

#### Scenario: Filtering one zone leaves the other zone unaffected
- **WHEN** the user types into the Maybeboard zone's filter
- **THEN** the Main Deck zone's visible cards are unchanged, since each zone's filter is independent

#### Scenario: Filtered-out cards still count toward deck totals
- **WHEN** a zone's filter hides one or more cards from view
- **THEN** the budget total, card count, and legality check continue to reflect the full deck, including the hidden cards

#### Scenario: User clears a zone's filter
- **WHEN** the user clears the typed text from a zone's filter
- **THEN** that zone shows all of its cards again, grouped and sorted as usual

#### Scenario: Comandante and Comandante Parceiro have no filter
- **WHEN** the user filters Main Deck or Maybeboard
- **THEN** the Comandante and Comandante Parceiro zones are unaffected and expose no filter control of their own

#### Scenario: Filter matches the non-displayed name language
- **WHEN** the name-language toggle is set to English and the user types a substring that matches only a card's Portuguese name
- **THEN** that card still appears in the filtered results, even though its Portuguese name isn't currently shown on screen

### Requirement: Manual price edit on any card
The deck view SHALL let the user edit any non-basic-land card's displayed price directly, in any zone — including Comandante and Comandante Parceiro — and in both List and Visual view, by clicking the price to turn it into an editable field. Committing the edit (Enter or blur) SHALL save the new value immediately; cancelling (Escape) SHALL leave the price unchanged. Basic lands SHALL NOT show a price field at all — their quantity stepper takes its place.

#### Scenario: User edits a Main Deck card's price
- **WHEN** the user clicks a Main Deck card's price, enters a new value, and commits it
- **THEN** the card's displayed price updates immediately, and its position under the active grouping and sort axes is recomputed using the new value

#### Scenario: User edits the primary Comandante's price
- **WHEN** the user clicks the price shown on the card in the Comandante zone and commits a new value
- **THEN** the commander's displayed price updates immediately

#### Scenario: User cancels an in-progress price edit
- **WHEN** the user opens a card's price editor and presses Escape before committing
- **THEN** the card's price is unchanged

#### Scenario: User enters an invalid price
- **WHEN** the user commits a non-numeric or negative value in the price editor
- **THEN** the edit is rejected and the card's previous price is retained

#### Scenario: User sets a price on a card that never resolved one
- **WHEN** the user clicks the price on a card whose price is unresolved (shown as "—") and commits a numeric value
- **THEN** the card's price is set to that value and displayed accordingly

#### Scenario: Price edit does not trigger a drag
- **WHEN** the user clicks into a card's price editor and types
- **THEN** no drag-and-drop move is triggered by that interaction

#### Scenario: Price edit works in Visual view
- **WHEN** the user clicks a card's price in Visual view and commits a new value
- **THEN** the tile's displayed price updates immediately, the same as in List view

#### Scenario: Basic land shows no price field
- **WHEN** a basic land renders in any zone, in either List or Visual view
- **THEN** no price field is shown for it, and its quantity stepper occupies that space instead

### Requirement: Editable fields give hover and control feedback distinct from the draggable row
Every editable or clickable inline control within a card row or tile (the price display before editing, the price editor's input, and the quantity stepper's buttons and input) SHALL show a cursor that signals its own affordance — a pointer for a clickable display or button, a text cursor for a typeable field — rather than inheriting the surrounding row or tile's drag cursor. No number input in the deck view SHALL show the browser's native increment/decrement spin-button controls; the quantity stepper's own +/− buttons are the only such affordance anywhere in the deck view.

#### Scenario: Hovering an editable price shows an editing cursor
- **WHEN** the user hovers a card's price display without dragging
- **THEN** the cursor indicates the price is clickable, not that the row is draggable

#### Scenario: Hovering the quantity stepper's buttons shows a clickable cursor
- **WHEN** the user hovers a basic land's "+" or "−" button
- **THEN** the cursor indicates the button is clickable, not that the row is draggable

#### Scenario: No native spin buttons appear on any number input
- **WHEN** the user hovers or focuses the quantity stepper's input or the price editor's input
- **THEN** no browser-native increment/decrement arrows are shown on that input

#### Scenario: A basic land's quantity field displays 3-digit values without clipping
- **WHEN** a basic land's quantity is 100 or any other 3-digit value
- **THEN** the full value is visible in the quantity field, not clipped or truncated

### Requirement: Custom group order overrides the sort axis, until reset
Reordering a card within a group (Main Deck or Maybeboard only) gives that entire group a custom order: every card in the group is stamped with the sequence it is in at that moment, and the group renders in that sequence instead of being sorted by the active sort axis. Switching the grouping axis SHALL NOT discard a group's custom order — it simply does not apply to groups formed under a different axis, since group membership is a different partition; switching back to the original grouping axis SHALL re-apply whatever custom order those groups still carry. Selecting a sort axis — whether a different one, or re-selecting the one already active — SHALL clear every group's custom order deck-wide, reverting all groups to sort-axis ordering. A card that later lands in an already-custom-ordered group (dragged in from elsewhere, or newly captured into that group) SHALL be appended at the end of that group's custom order.

#### Scenario: Reordering a card gives its whole group a custom order
- **WHEN** the user drags a card to a new position within its group
- **THEN** every card in that group is stamped with its current displayed sequence, and the group subsequently renders in that exact sequence regardless of the active sort axis

#### Scenario: Custom order goes dormant across a grouping-axis switch
- **WHEN** a group has a custom order and the user switches the grouping axis to one that partitions cards differently
- **THEN** the newly formed groups render by the active sort axis, and the original group's custom order is not discarded

#### Scenario: Custom order reactivates when the original grouping axis is restored
- **WHEN** the user switches back to the grouping axis under which a group was given a custom order
- **THEN** that group renders in its custom order again

#### Scenario: Selecting a different sort axis clears every custom order
- **WHEN** one or more groups have a custom order and the user selects a sort axis different from the one active when they were created
- **THEN** every group's custom order is cleared and all groups render by the newly selected sort axis

#### Scenario: Re-selecting the active sort axis clears every custom order
- **WHEN** one or more groups have a custom order and the user re-selects the sort axis that is already active
- **THEN** every group's custom order is cleared and all groups render by that sort axis, the same generalized resync affordance the Name-axis toggle already uses

#### Scenario: A new card joins an already-custom-ordered group
- **WHEN** a card is dragged into, or newly captured into, a group that already has a custom order
- **THEN** the new card appears at the end of that group's custom order

### Requirement: Per-zone collapse/expand toggle
Each of the four zones (Comandante, Comandante Parceiro, Main Deck, Maybeboard) SHALL offer its own independent control, on its header, to collapse or expand that zone. Collapsing a zone SHALL hide its card list — and, for Main Deck and Maybeboard, its name filter — while keeping the zone's header, card count, and any zone-level error message visible. Each zone's collapsed/expanded state SHALL be independent of every other zone's. This state SHALL be session-only: every zone SHALL start expanded whenever the deck view is freshly loaded, not restored from a prior session. Collapsing a zone SHALL NOT change the automatic slim-hint treatment Comandante Parceiro already gets when it holds no card; that behavior applies regardless of the manual toggle's state.

#### Scenario: User collapses Main Deck
- **WHEN** the user activates the collapse control on the Main Deck zone
- **THEN** Main Deck's card list and name filter are hidden, while its header and card count remain visible

#### Scenario: User expands a collapsed zone
- **WHEN** the user activates the expand control on a collapsed zone
- **THEN** that zone's card list (and name filter, if it has one) becomes visible again

#### Scenario: Collapsing one zone leaves others unaffected
- **WHEN** the user collapses Maybeboard
- **THEN** Main Deck, Comandante, and Comandante Parceiro remain in whatever state they were already in

#### Scenario: Every zone starts expanded on a fresh load
- **WHEN** the deck view loads for the first time in a new tab session
- **THEN** all four zones render expanded, regardless of how they were left in a previous session

#### Scenario: Collapsing Comandante Parceiro while it holds a card
- **WHEN** the user collapses the Comandante Parceiro zone while it holds a partner commander
- **THEN** the zone collapses to header-only, the same as any other zone would

#### Scenario: An empty Comandante Parceiro keeps its existing slim-hint treatment
- **WHEN** the Comandante Parceiro zone holds no card, regardless of whether it has been manually collapsed or expanded
- **THEN** it renders using the existing automatic slim-hint treatment for an empty hero zone

### Requirement: Zone header control layout
Every zone's header SHALL lay out its controls in the same three fixed regions, regardless of which controls that zone has: the zone name and card count on the left, the name filter centered (left empty for zones without a filter), and the collapse/expand toggle anchored to the top-right corner. This layout SHALL be identical across all four zones.

#### Scenario: A zone with a filter shows all three regions
- **WHEN** Main Deck or Maybeboard renders its header
- **THEN** the name and count appear on the left, the filter appears centered in the header, and the collapse toggle appears in the top-right corner

#### Scenario: A zone without a filter still anchors the toggle to the same corner
- **WHEN** Comandante or Comandante Parceiro renders its header
- **THEN** the collapse toggle appears in the same top-right corner position as it does in Main Deck and Maybeboard, with the center region left empty

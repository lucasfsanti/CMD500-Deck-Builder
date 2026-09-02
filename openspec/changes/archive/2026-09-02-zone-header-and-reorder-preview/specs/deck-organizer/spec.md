## MODIFIED Requirements

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

## ADDED Requirements

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

### Requirement: Zone header control layout
Every zone's header SHALL lay out its controls in the same three fixed regions, regardless of which controls that zone has: the zone name and card count on the left, the name filter centered (left empty for zones without a filter), and the collapse/expand toggle anchored to the top-right corner. This layout SHALL be identical across all four zones.

#### Scenario: A zone with a filter shows all three regions
- **WHEN** Main Deck or Maybeboard renders its header
- **THEN** the name and count appear on the left, the filter appears centered in the header, and the collapse toggle appears in the top-right corner

#### Scenario: A zone without a filter still anchors the toggle to the same corner
- **WHEN** Comandante or Comandante Parceiro renders its header
- **THEN** the collapse toggle appears in the same top-right corner position as it does in Main Deck and Maybeboard, with the center region left empty

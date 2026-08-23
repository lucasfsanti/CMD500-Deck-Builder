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
Within each zone, the deck view SHALL group cards by a user-selectable grouping axis — card type (the default), color identity, or converted mana cost — applying to all zones at once. Groups SHALL appear in the active axis's own natural order (card type order, WUBRG color order, or ascending mana cost). Within a group, cards SHALL be sorted by the two axes not used for grouping, in the same type-then-color-then-mana-cost priority the default (Type) grouping already uses minus whichever is the active axis, and then by name.

#### Scenario: Main Deck contains creatures and instants of varying CMC
- **WHEN** the Main Deck zone contains a mix of creature and instant cards with different mana values, with the grouping axis set to Type (the default)
- **THEN** creatures and instants render as separate type groups, and within each type group cards are ordered by color identity and then ascending CMC

#### Scenario: User switches the grouping axis to Color
- **WHEN** the user sets the grouping axis to Color
- **THEN** every zone re-renders grouped by color identity instead of type, with groups ordered colorless/W/U/B/R/G/multicolor (the same color-identity order deck-analytics's color chart already uses) and cards within each group ordered by type and then ascending CMC

#### Scenario: User switches the grouping axis to Mana Cost
- **WHEN** the user sets the grouping axis to Mana Cost
- **THEN** every zone re-renders grouped by converted mana cost (ascending) instead of type, with cards within each group ordered by type and then color identity

### Requirement: Drag-and-drop card movement between zones
The user SHALL be able to move a card from one zone to another by dragging it, and the move SHALL be reflected immediately in the organizer's grouping, the budget total, and the legality check.

#### Scenario: User drags a card from Maybeboard to Main Deck
- **WHEN** the user drags a card from the Maybeboard zone and drops it on the Main Deck zone
- **THEN** the card is removed from Maybeboard, added to Main Deck under its correct group for the active grouping axis, and the budget and legality panels update to reflect the move

#### Scenario: User drags a card onto an invalid target
- **WHEN** the user drags a card and drops it outside any recognized zone
- **THEN** the card remains in its original zone and no state change occurs

### Requirement: Drag visual feedback follows the cursor
While a card is being dragged, the deckbuilder SHALL show a semi-transparent ghost of that card positioned so the point the user grabbed it remains under the pointer; the ghost SHALL disappear when the drag ends.

#### Scenario: User drags a card in List view
- **WHEN** the user presses and drags a card row
- **THEN** a semi-transparent ghost of that row follows the pointer for the duration of the drag

#### Scenario: User grabs a Visual-mode tile away from its center
- **WHEN** the user grabs a Visual-view artwork tile near its bottom edge and drags it
- **THEN** the ghost's grabbed point stays under the pointer throughout the drag, not the tile's overall bounding-box center

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
When the user changes a card's quantity directly (outside of drag-and-drop), the organizer SHALL keep the card in its correct group for the active grouping axis and update dependent totals.

#### Scenario: User increases a Main Deck card's quantity
- **WHEN** the user edits a card's quantity field in the Main Deck zone
- **THEN** the card stays in its existing group, the displayed quantity updates, and the budget total recomputes using the new quantity

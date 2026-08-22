# deck-organizer Specification

## Purpose

Presents the captured decklist as an editable, zone-based deck view — grouping and sorting cards within each zone and letting the user move cards between zones by drag-and-drop.

## Requirements

### Requirement: Five deck zones
The deck view SHALL organize cards into exactly five zones: Comandante, Comandante Parceiro, Main Deck, Sideboard, and Maybeboard, matching LigaMagic's own zone model.

#### Scenario: Captured deck has cards in all five zones
- **WHEN** the captured decklist includes cards assigned to each of the five zones
- **THEN** the deck view renders five distinct zone sections, each showing only the cards assigned to it

### Requirement: Grouping and sorting within a zone
Within each zone, the deck view SHALL group cards by card type, then by color identity, then by converted mana cost (ascending), and SHALL sort cards within a group by name.

#### Scenario: Main Deck contains creatures and instants of varying CMC
- **WHEN** the Main Deck zone contains a mix of creature and instant cards with different mana values
- **THEN** creatures and instants render as separate type groups, and within each type group cards are ordered by color identity and then ascending CMC

### Requirement: Drag-and-drop card movement between zones
The user SHALL be able to move a card from one zone to another by dragging it, and the move SHALL be reflected immediately in the organizer's grouping, the budget total, and the legality check.

#### Scenario: User drags a card from Maybeboard to Main Deck
- **WHEN** the user drags a card from the Maybeboard zone and drops it on the Main Deck zone
- **THEN** the card is removed from Maybeboard, added to Main Deck in its correct type/color/CMC group, and the budget and legality panels update to reflect the move

#### Scenario: User drags a card onto an invalid target
- **WHEN** the user drags a card and drops it outside any recognized zone
- **THEN** the card remains in its original zone and no state change occurs

### Requirement: Commander zone cardinality
The Comandante zone SHALL accept a single card unless a legal partner-commander pair is present, in which case the Comandante Parceiro zone holds the second card; the organizer SHALL prevent placing more cards in Comandante/Comandante Parceiro than the format allows.

#### Scenario: User drags a second, non-partner card into Comandante
- **WHEN** the Comandante zone already holds a commander without the partner keyword and the user drags another card onto Comandante
- **THEN** the drop is rejected and the user sees a message explaining only a partner commander may be added

### Requirement: Manual quantity edits stay grouped correctly
When the user changes a card's quantity directly (outside of drag-and-drop), the organizer SHALL keep the card in its correct type/color/CMC group and update dependent totals.

#### Scenario: User increases a Main Deck card's quantity
- **WHEN** the user edits a card's quantity field in the Main Deck zone
- **THEN** the card stays in its existing group, the displayed quantity updates, and the budget total recomputes using the new quantity

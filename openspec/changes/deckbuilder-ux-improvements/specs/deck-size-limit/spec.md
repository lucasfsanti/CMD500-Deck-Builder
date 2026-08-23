## Purpose

Warns the user, live, when the deck's counted card total exceeds Commander's 99-card limit, mirroring budget-tracking's over-cap visual treatment.

## ADDED Requirements

### Requirement: Card-count cap scoped to Main Deck and Comandante Parceiro
The deck's card count against the 99-card limit SHALL be computed as the summed quantity of cards in the Main Deck and Comandante Parceiro zones — the same zones budget-tracking counts toward the R$500 cap. The primary Comandante and Maybeboard SHALL NOT contribute to this count. Unlike the budget total, basic lands SHALL count toward this total, since they occupy real deck slots under Commander's rules.

#### Scenario: Deck has 105 counted cards
- **WHEN** the summed quantity across Main Deck and Comandante Parceiro is 105
- **THEN** the deck is flagged as 6 cards over the 99-card limit

#### Scenario: Comandante and Maybeboard do not contribute
- **WHEN** the deck has cards in the primary Comandante zone and in Maybeboard, in addition to a 99-card Main Deck
- **THEN** the card-count total used for the limit check is 99, unaffected by the Comandante and Maybeboard cards

### Requirement: Visual feedback when the 99-card cap is exceeded
The deckbuilder SHALL visually distinguish the state where the counted card total is at or under 99 from the state where it exceeds 99, and SHALL show the exact amount by which the cap is exceeded when over, in a visual style consistent with the existing over-budget indicator.

#### Scenario: Counted card total is at or under 99
- **WHEN** the counted card total is 99 or fewer
- **THEN** the deckbuilder shows a normal, within-limit visual state

#### Scenario: Counted card total exceeds 99
- **WHEN** the counted card total is 105
- **THEN** the deckbuilder switches to an over-limit visual state and displays that the deck is 6 cards over the limit

### Requirement: Live recomputation on deck changes
The card-count total SHALL update immediately whenever the user adds, removes, moves, or changes the quantity of a card in a counted zone.

#### Scenario: User moves a card into Main Deck via drag-and-drop
- **WHEN** a card is dragged into a counted zone
- **THEN** the displayed card-count total updates within the same UI update that shows the move

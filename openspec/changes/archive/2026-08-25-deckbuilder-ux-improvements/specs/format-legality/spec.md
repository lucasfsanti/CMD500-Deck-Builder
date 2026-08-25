## MODIFIED Requirements

### Requirement: Deck-level illegal summary
The deck view SHALL display a summary count of illegal cards in the deck, visible without expanding individual zones.

#### Scenario: Deck has two banned cards in different zones
- **WHEN** the active banlist flags one card in Main Deck and one card in Maybeboard
- **THEN** the deck-level summary shows a count of 2 illegal cards

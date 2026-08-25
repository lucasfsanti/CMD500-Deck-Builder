## MODIFIED Requirements

### Requirement: Charts are scoped to Main Deck only
All three charts SHALL reflect only cards in the Main Deck zone, excluding Comandante, Comandante Parceiro, and Maybeboard.

#### Scenario: Deck has cards outside Main Deck
- **WHEN** the deck has cards in Comandante and/or Maybeboard in addition to Main Deck
- **THEN** none of the three charts' counts include those cards

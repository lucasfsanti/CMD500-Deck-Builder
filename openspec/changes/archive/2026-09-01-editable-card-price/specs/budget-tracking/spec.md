## MODIFIED Requirements

### Requirement: Live recomputation on deck changes
The displayed budget total SHALL update immediately whenever the user adds, removes, moves, changes the quantity of, or edits the price of a budget-counted card.

#### Scenario: User moves a priced card into Main Deck via drag-and-drop
- **WHEN** a budget-counted card is dragged into a budget-counted zone
- **THEN** the displayed total increases by that card's contribution within the same UI update that shows the move

#### Scenario: User edits a budget-counted card's price
- **WHEN** the user edits the price of a card in Main Deck or Comandante Parceiro and commits the new value
- **THEN** the displayed budget total recomputes using the new price within the same UI update

#### Scenario: User edits the primary Comandante's price
- **WHEN** the user edits the price of the card in the Comandante zone and commits a new value
- **THEN** the displayed budget total is unchanged, since the Comandante zone is excluded from budget regardless of its price

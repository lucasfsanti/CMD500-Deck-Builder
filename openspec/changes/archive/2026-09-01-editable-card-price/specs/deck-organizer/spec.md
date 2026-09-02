## ADDED Requirements

### Requirement: Manual price edit on any card
The deck view SHALL let the user edit any card's displayed price directly, in any zone — including Comandante and Comandante Parceiro — and in both List and Visual view, by clicking the price to turn it into an editable field. Committing the edit (Enter or blur) SHALL save the new value immediately; cancelling (Escape) SHALL leave the price unchanged.

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

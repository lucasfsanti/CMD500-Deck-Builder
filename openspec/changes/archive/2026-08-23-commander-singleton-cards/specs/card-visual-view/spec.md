## MODIFIED Requirements

### Requirement: Visual view shows artwork with identifying and pricing information
Each card in Visual view SHALL show its artwork, its name as a caption, its price (or unresolved-price indication), and — for basic lands only — its editable quantity, matching the same underlying data List view shows.

#### Scenario: Card is shown in Visual view
- **WHEN** a card renders in Visual view
- **THEN** its artwork, name, and price are all visible on or alongside the card, and its editable quantity is additionally visible if it is a basic land

#### Scenario: Non-basic card is shown in Visual view
- **WHEN** a non-basic card renders in Visual view
- **THEN** its artwork, name, and price are visible on the tile, with no quantity field

### Requirement: Visual view preserves existing per-card functionality
Drag-and-drop movement between zones, manual quantity editing on basic lands, the hover-revealed removal control, and the illegal-card and over-budget visual markers SHALL all work the same in Visual view as they do in List view.

#### Scenario: User drags a card between zones in Visual view
- **WHEN** the user drags a card's artwork tile from one zone to another in Visual view
- **THEN** the card moves zones the same way it would in List view

#### Scenario: An illegal or over-budget card is shown in Visual view
- **WHEN** a card that is illegal for the active format, or that counts toward the deck being over budget, renders in Visual view
- **THEN** its illegal and/or over-budget markers are visible on its artwork tile, distinguishable the same way they are in List view

#### Scenario: User removes a card in Visual view
- **WHEN** the user activates the removal control on a Visual-view tile
- **THEN** the card is removed the same way it would be in List view

## MODIFIED Requirements

### Requirement: Visual view preserves existing per-card functionality
Drag-and-drop movement between zones, within-group custom reordering, manual quantity editing on basic lands, the hover-revealed removal control, and the illegal-card and over-budget visual markers SHALL all work the same in Visual view as they do in List view.

#### Scenario: User drags a card between zones in Visual view
- **WHEN** the user drags a card's artwork tile from one zone to another in Visual view
- **THEN** the card moves zones the same way it would in List view

#### Scenario: User reorders a tile within its group in Visual view
- **WHEN** the user drags a tile to a new position among the other tiles in its own group
- **THEN** the group takes on a custom order the same way a List-view reorder would, rendering identically whichever view is active afterward

#### Scenario: An illegal or over-budget card is shown in Visual view
- **WHEN** a card that is illegal for the active format, or that counts toward the deck being over budget, renders in Visual view
- **THEN** its illegal and/or over-budget markers are visible on its artwork tile, distinguishable the same way they are in List view

#### Scenario: User removes a card in Visual view
- **WHEN** the user activates the removal control on a Visual-view tile
- **THEN** the card is removed the same way it would be in List view

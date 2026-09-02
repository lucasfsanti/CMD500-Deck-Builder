## MODIFIED Requirements

### Requirement: Drag-and-drop card movement between zones
The user SHALL be able to move a card from one zone to another by dragging it, and the move SHALL be reflected immediately in the organizer's grouping, the budget total, and the legality check. In Main Deck or Maybeboard, dragging a card and dropping it at a specific position among other cards within its own current group SHALL reorder that group into a custom order instead of moving the card to a different zone. A collapsed zone SHALL remain a valid drop target: dropping a card onto it SHALL move the card there the same as an expanded zone would, and SHALL expand that zone so the user sees the result.

#### Scenario: User drags a card from Maybeboard to Main Deck
- **WHEN** the user drags a card from the Maybeboard zone and drops it on the Main Deck zone
- **THEN** the card is removed from Maybeboard, added to Main Deck under its correct group for the active grouping axis, and the budget and legality panels update to reflect the move

#### Scenario: User drags a card onto an invalid target
- **WHEN** the user drags a card and drops it outside any recognized zone
- **THEN** the card remains in its original zone and no state change occurs

#### Scenario: User reorders a card within its own group
- **WHEN** the user drags a card in Main Deck or Maybeboard and drops it at a different position among the other cards in its own group
- **THEN** the card moves to that position within the group and no zone change occurs

#### Scenario: User drops a card onto a collapsed zone
- **WHEN** the user drags a card and drops it onto a zone that is currently collapsed
- **THEN** the card moves into that zone the same as it would if the zone were expanded, and the zone expands so the moved card is visible

## ADDED Requirements

### Requirement: Per-zone collapse/expand toggle
Each of the four zones (Comandante, Comandante Parceiro, Main Deck, Maybeboard) SHALL offer its own independent control, on its header, to collapse or expand that zone. Collapsing a zone SHALL hide its card list — and, for Main Deck and Maybeboard, its name filter — while keeping the zone's header, card count, and any zone-level error message visible. Each zone's collapsed/expanded state SHALL be independent of every other zone's. This state SHALL be session-only: every zone SHALL start expanded whenever the deck view is freshly loaded, not restored from a prior session. Collapsing a zone SHALL NOT change the automatic slim-hint treatment Comandante Parceiro already gets when it holds no card; that behavior applies regardless of the manual toggle's state.

#### Scenario: User collapses Main Deck
- **WHEN** the user activates the collapse control on the Main Deck zone
- **THEN** Main Deck's card list and name filter are hidden, while its header and card count remain visible

#### Scenario: User expands a collapsed zone
- **WHEN** the user activates the expand control on a collapsed zone
- **THEN** that zone's card list (and name filter, if it has one) becomes visible again

#### Scenario: Collapsing one zone leaves others unaffected
- **WHEN** the user collapses Maybeboard
- **THEN** Main Deck, Comandante, and Comandante Parceiro remain in whatever state they were already in

#### Scenario: Every zone starts expanded on a fresh load
- **WHEN** the deck view loads for the first time in a new tab session
- **THEN** all four zones render expanded, regardless of how they were left in a previous session

#### Scenario: Collapsing Comandante Parceiro while it holds a card
- **WHEN** the user collapses the Comandante Parceiro zone while it holds a partner commander
- **THEN** the zone collapses to header-only, the same as any other zone would

#### Scenario: An empty Comandante Parceiro keeps its existing slim-hint treatment
- **WHEN** the Comandante Parceiro zone holds no card, regardless of whether it has been manually collapsed or expanded
- **THEN** it renders using the existing automatic slim-hint treatment for an empty hero zone

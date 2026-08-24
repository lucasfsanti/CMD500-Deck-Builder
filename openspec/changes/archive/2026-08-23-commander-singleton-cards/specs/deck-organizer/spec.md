## MODIFIED Requirements

### Requirement: Manual quantity edits stay grouped correctly
Only basic land cards SHALL expose an editable quantity field; non-basic cards SHALL NOT. When the user changes a basic land's quantity directly (outside of drag-and-drop), the organizer SHALL keep the card in its correct group for the active grouping axis and update dependent totals.

#### Scenario: User increases a Main Deck card's quantity
- **WHEN** the user edits a basic land's quantity field in the Main Deck zone
- **THEN** the card stays in its existing group, the displayed quantity updates, and the budget total recomputes using the new quantity

#### Scenario: Non-basic card has no quantity field
- **WHEN** a non-basic card renders in any zone, in either List or Visual view
- **THEN** no editable quantity field is shown for it

## ADDED Requirements

### Requirement: Non-basic card quantity is normalized to one
A non-basic card's quantity SHALL always be treated as 1, regardless of what value the source LigaMagic page reported, including on any later re-sync from the source page.

#### Scenario: Captured page reports more than one copy of a non-basic card
- **WHEN** the captured LigaMagic page shows a quantity greater than 1 for a non-basic card
- **THEN** the organizer treats that card's quantity as 1, and dependent totals (budget, card count) are computed using 1

#### Scenario: A later re-sync from the source page still reports a stale quantity
- **WHEN** the deck re-syncs from its source LigaMagic page and the page still reports more than one copy of a non-basic card
- **THEN** the re-synced card's quantity is again normalized to 1

### Requirement: Explicit card removal
The user SHALL be able to remove any card from the deck entirely via a dedicated control on that card, distinct from moving it between zones. The control SHALL be hidden until the card is hovered, and activating it SHALL take effect immediately, updating dependent totals (budget, card count, legality) the same way a zone move does.

#### Scenario: User removes a card from a zone
- **WHEN** the user hovers a card and activates its removal control
- **THEN** the card no longer appears in any zone, and the budget, card count, and legality panels update to reflect its absence

#### Scenario: Removal control stays hidden until hovered
- **WHEN** a card is not hovered
- **THEN** its removal control is not visible

#### Scenario: Removal control does not trigger drag
- **WHEN** the user activates the removal control on a card
- **THEN** no drag-and-drop move is triggered by that interaction

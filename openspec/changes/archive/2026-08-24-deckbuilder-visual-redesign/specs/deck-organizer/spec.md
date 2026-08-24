## MODIFIED Requirements

### Requirement: Explicit card removal
The user SHALL be able to remove any card from the deck entirely via a dedicated control on that card, distinct from moving it between zones, EXCEPT the primary Comandante, which SHALL NOT expose a removal control — the format's defining card is corrected by dragging it out to another zone and dragging the intended commander into the now-empty Comandante, not by deleting it outright. Everywhere else, the control SHALL be hidden until the card is hovered, and activating it SHALL take effect immediately, updating dependent totals (budget, card count, legality) the same way a zone move does.

#### Scenario: User removes a card from a zone
- **WHEN** the user hovers a card in any zone other than Comandante and activates its removal control
- **THEN** the card no longer appears in any zone, and the budget, card count, and legality panels update to reflect its absence

#### Scenario: Comandante has no removal control
- **WHEN** the user hovers the card in the Comandante zone
- **THEN** no removal control appears for it

#### Scenario: Removal control stays hidden until hovered
- **WHEN** a removable card is not hovered
- **THEN** its removal control is not visible

#### Scenario: Removal control does not trigger drag
- **WHEN** the user activates a removal control on a card
- **THEN** no drag-and-drop move is triggered by that interaction

### Requirement: Grouping and sorting within a zone
Within each zone, the deck view SHALL group cards by a user-selectable grouping axis — card type (the default), color identity, or converted mana cost — applying to all zones at once. Groups SHALL appear in the active axis's own natural order (card type order, WUBRG color order, or ascending mana cost). Within a group, cards SHALL be sorted by a separate user-selectable sort axis — mana value (the default, ascending), name (alphabetical), color identity (colorless/W/U/B/R/G/multicolor order), or price in R$ (descending, highest first) — applying to all zones at once, with name used as a tiebreak whenever the sort axis does not fully order two cards. A card whose price has not resolved SHALL sort after every priced card when the sort axis is price.

#### Scenario: Main Deck contains creatures and instants of varying CMC
- **WHEN** the Main Deck zone contains a mix of creature and instant cards with different mana values, with the grouping axis set to Type (the default) and the sort axis set to Mana Value (the default)
- **THEN** creatures and instants render as separate type groups, and within each type group cards are ordered by ascending mana value and then by name

#### Scenario: User switches the grouping axis to Color
- **WHEN** the user sets the grouping axis to Color
- **THEN** every zone re-renders grouped by color identity instead of type, with groups ordered colorless/W/U/B/R/G/multicolor (the same color-identity order deck-analytics's color chart already uses), cards within each group still ordered by the active sort axis

#### Scenario: User switches the grouping axis to Mana Cost
- **WHEN** the user sets the grouping axis to Mana Cost
- **THEN** every zone re-renders grouped by converted mana cost (ascending) instead of type, with cards within each group still ordered by the active sort axis

#### Scenario: User switches the sort axis to Price
- **WHEN** the user sets the sort axis to Price
- **THEN** every zone re-renders with cards within each group ordered by descending price (highest R$ first), cards with an unresolved price ordered after all priced cards, then by name

#### Scenario: User switches the sort axis to Name or Color
- **WHEN** the user sets the sort axis to Name or Color
- **THEN** every zone re-renders with cards within each group ordered alphabetically by name, or by color identity in colorless/W/U/B/R/G/multicolor order, respectively, using name as the tiebreak either way
